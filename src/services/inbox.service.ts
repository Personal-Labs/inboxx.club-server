import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

export interface ListMessagesOptions {
  limit: number;
  cursor?: string | undefined;
}

export interface ListMessagesResult {
  username: string;
  messages: {
    id: string;
    fromAddress: string;
    fromName: string | null;
    subject: string | null;
    textPreview: string | null;
    receivedAt: Date;
    attachments: {
      id: string;
      filename: string;
      contentType: string;
      size: number;
    }[];
  }[];
  hasMore: boolean;
  nextCursor: string | null;
}

export async function listMessages(
  username: string,
  options: ListMessagesOptions
): Promise<ListMessagesResult> {
  const inbox = await prisma.inbox.findUnique({
    where: { username },
    include: {
      messages: {
        take: options.limit + 1,
        orderBy: { receivedAt: "desc" },
        ...(options.cursor && {
          cursor: { id: options.cursor },
          skip: 1,
        }),
        select: {
          id: true,
          fromAddress: true,
          fromName: true,
          subject: true,
          textPreview: true,
          receivedAt: true,
          attachments: {
            select: { id: true, filename: true, contentType: true, size: true },
          },
        },
      },
    },
  });

  if (!inbox) {
    return {
      username,
      messages: [],
      hasMore: false,
      nextCursor: null,
    };
  }

  const hasMore = inbox.messages.length > options.limit;
  const messages = hasMore ? inbox.messages.slice(0, -1) : inbox.messages;
  const nextCursor = hasMore ? (messages[messages.length - 1]?.id ?? null) : null;

  return {
    username,
    messages,
    hasMore,
    nextCursor,
  };
}

export async function deleteInbox(username: string): Promise<boolean> {
  const inbox = await prisma.inbox.findUnique({ where: { username } });

  if (!inbox) {
    return false;
  }

  await prisma.inbox.delete({ where: { username } });
  return true;
}

export async function createOrUpdateInbox(username: string): Promise<string> {
  const expiresAt = new Date(Date.now() + env.RETENTION_HOURS * 60 * 60 * 1000);

  const inbox = await prisma.inbox.upsert({
    where: { username },
    update: { expiresAt },
    create: { username, expiresAt },
  });

  return inbox.id;
}
