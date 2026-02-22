import { simpleParser, type ParsedMail, type Attachment } from "mailparser";
import { prisma } from "../lib/prisma.js";
import { putObject, getObject } from "../lib/s3.js";
import { env } from "../config/env.js";
import { isReservedUsername } from "./inbox.service.js";

const USERNAME_REGEX = /^[a-z0-9._-]{3,40}$/;

interface ProcessedEmail {
  messageId: string;
  inboxId: string;
  username: string;
}

interface InboundEventLog {
  s3RawKey: string;
  status: "success" | "failed" | "invalid_recipient";
  messageId?: string | undefined;
  error?: string | undefined;
}

function extractUsername(email: string): string | null {
  const domain = env.EMAIL_DOMAIN.toLowerCase();
  const lowerEmail = email.toLowerCase();
  const atDomain = `@${domain}`;

  if (!lowerEmail.endsWith(atDomain)) {
    return null;
  }

  const localPart = lowerEmail.slice(0, -atDomain.length);
  return USERNAME_REGEX.test(localPart) ? localPart : null;
}

function getFirstRecipient(parsed: ParsedMail): string | null {
  const toAddresses = parsed.to;
  if (!toAddresses) return null;

  const addresses = Array.isArray(toAddresses) ? toAddresses : [toAddresses];
  for (const addr of addresses) {
    if (addr.value.length > 0 && addr.value[0]?.address) {
      return addr.value[0].address;
    }
  }
  return null;
}

function generatePreview(text: string | undefined, maxLength = 200): string | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) + "..." : cleaned;
}

async function logInboundEvent(event: InboundEventLog): Promise<void> {
  await prisma.inboundEvent.create({
    data: {
      s3RawKey: event.s3RawKey,
      status: event.status,
      messageId: event.messageId ?? null,
      error: event.error ?? null,
    },
  });
}

export async function processInboundEmail(s3RawKey: string): Promise<ProcessedEmail> {
  let parsed: ParsedMail;

  try {
    // Fetch raw email from S3
    const rawEmail = await getObject(s3RawKey);
    if (!rawEmail) {
      await logInboundEvent({
        s3RawKey,
        status: "failed",
        error: "Raw email not found in S3",
      });
      throw new Error("Raw email not found in S3");
    }

    // Parse email
    parsed = await simpleParser(rawEmail);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown parse error";
    await logInboundEvent({
      s3RawKey,
      status: "failed",
      error: errorMessage,
    });
    throw error;
  }

  // Extract recipient and username
  const recipient = getFirstRecipient(parsed);
  if (!recipient) {
    await logInboundEvent({
      s3RawKey,
      status: "invalid_recipient",
      error: "No valid recipient found",
    });
    throw new Error("No valid recipient found");
  }

  const username = extractUsername(recipient);
  if (!username) {
    await logInboundEvent({
      s3RawKey,
      status: "invalid_recipient",
      error: `Invalid recipient: ${recipient}`,
    });
    throw new Error(`Invalid recipient: ${recipient}`);
  }

  // Check if username is reserved
  if (isReservedUsername(username)) {
    await logInboundEvent({
      s3RawKey,
      status: "invalid_recipient",
      error: `Reserved username: ${username}`,
    });
    throw new Error(`Reserved username: ${username}`);
  }

  // Create or update inbox
  const expiresAt = new Date(Date.now() + env.RETENTION_HOURS * 60 * 60 * 1000);
  const inbox = await prisma.inbox.upsert({
    where: { username },
    update: { expiresAt },
    create: { username, expiresAt },
  });

  // Generate S3 keys for parsed content
  const messageId = crypto.randomUUID();
  const s3HtmlKey = parsed.html ? `html/${messageId}.html` : null;
  const s3TextKey = parsed.text ? `text/${messageId}.txt` : null;

  // Upload parsed content to S3
  if (parsed.html && s3HtmlKey) {
    await putObject(s3HtmlKey, parsed.html, "text/html");
  }
  if (parsed.text && s3TextKey) {
    await putObject(s3TextKey, parsed.text, "text/plain");
  }

  // Extract sender info
  const fromAddress = parsed.from?.value[0]?.address ?? "unknown@unknown.com";
  const fromName = parsed.from?.value[0]?.name ?? null;

  // Create message record
  const message = await prisma.message.create({
    data: {
      id: messageId,
      inboxId: inbox.id,
      fromAddress,
      fromName,
      toAddress: recipient,
      subject: parsed.subject ?? null,
      s3RawKey,
      s3HtmlKey,
      s3TextKey,
      textPreview: generatePreview(parsed.text),
      expiresAt,
    },
  });

  // Process attachments
  if (parsed.attachments.length > 0) {
    await processAttachments(message.id, parsed.attachments);
  }

  await logInboundEvent({
    s3RawKey,
    status: "success",
    messageId: message.id,
  });

  return {
    messageId: message.id,
    inboxId: inbox.id,
    username,
  };
}

async function processAttachments(messageId: string, attachments: Attachment[]): Promise<void> {
  for (const attachment of attachments) {
    const filename = attachment.filename ?? `attachment-${crypto.randomUUID()}`;
    const s3Key = `attachments/${messageId}/${filename}`;

    // Upload attachment to S3
    await putObject(s3Key, attachment.content, attachment.contentType);

    // Create attachment record
    await prisma.attachment.create({
      data: {
        messageId,
        filename,
        contentType: attachment.contentType,
        size: attachment.size,
        s3Key,
      },
    });
  }
}

export async function processInboundEmailFromRaw(rawEmail: string): Promise<ProcessedEmail> {
  // Generate S3 key and upload raw email
  const s3RawKey = `raw/${crypto.randomUUID()}.eml`;
  await putObject(s3RawKey, rawEmail, "message/rfc822");

  // Process the email
  return processInboundEmail(s3RawKey);
}
