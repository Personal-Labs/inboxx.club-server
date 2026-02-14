import { prisma } from "../lib/prisma.js";
import { deleteObject } from "../lib/s3.js";

interface CleanupResult {
  deletedInboxes: number;
  deletedMessages: number;
  deletedAttachments: number;
  deletedS3Objects: number;
  deletedInboundEvents: number;
  errors: string[];
}

export async function runCleanup(): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedInboxes: 0,
    deletedMessages: 0,
    deletedAttachments: 0,
    deletedS3Objects: 0,
    deletedInboundEvents: 0,
    errors: [],
  };

  const now = new Date();

  // Find expired messages with their attachments
  const expiredMessages = await prisma.message.findMany({
    where: { expiresAt: { lte: now } },
    include: { attachments: true },
  });

  // Delete S3 objects for each expired message
  for (const message of expiredMessages) {
    const s3Keys: string[] = [message.s3RawKey];

    if (message.s3HtmlKey) s3Keys.push(message.s3HtmlKey);
    if (message.s3TextKey) s3Keys.push(message.s3TextKey);

    for (const attachment of message.attachments) {
      s3Keys.push(attachment.s3Key);
      result.deletedAttachments++;
    }

    for (const key of s3Keys) {
      try {
        await deleteObject(key);
        result.deletedS3Objects++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`Failed to delete S3 object ${key}: ${errorMessage}`);
      }
    }

    result.deletedMessages++;
  }

  // Delete expired messages from database (attachments cascade)
  if (expiredMessages.length > 0) {
    await prisma.message.deleteMany({
      where: { expiresAt: { lte: now } },
    });
  }

  // Delete expired inboxes (messages already deleted above)
  const deletedInboxes = await prisma.inbox.deleteMany({
    where: { expiresAt: { lte: now } },
  });
  result.deletedInboxes = deletedInboxes.count;

  // Clean up old inbound events (older than 7 days)
  const eventRetention = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const deletedEvents = await prisma.inboundEvent.deleteMany({
    where: { processedAt: { lte: eventRetention } },
  });
  result.deletedInboundEvents = deletedEvents.count;

  return result;
}

export async function getCleanupStats(): Promise<{
  expiredInboxes: number;
  expiredMessages: number;
  oldInboundEvents: number;
}> {
  const now = new Date();
  const eventRetention = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [expiredInboxes, expiredMessages, oldInboundEvents] = await Promise.all([
    prisma.inbox.count({ where: { expiresAt: { lte: now } } }),
    prisma.message.count({ where: { expiresAt: { lte: now } } }),
    prisma.inboundEvent.count({ where: { processedAt: { lte: eventRetention } } }),
  ]);

  return { expiredInboxes, expiredMessages, oldInboundEvents };
}
