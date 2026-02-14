import { prisma } from "../lib/prisma.js";
import { getObject } from "../lib/s3.js";

export interface MessageDetail {
  id: string;
  fromAddress: string;
  fromName: string | null;
  toAddress: string;
  subject: string | null;
  body: string | null;
  bodyType: "html" | "text" | null;
  receivedAt: Date;
  attachments: {
    id: string;
    filename: string;
    contentType: string;
    size: number;
  }[];
}

export async function getMessageById(id: string): Promise<MessageDetail | null> {
  const message = await prisma.message.findUnique({
    where: { id },
    include: {
      attachments: {
        select: {
          id: true,
          filename: true,
          contentType: true,
          size: true,
        },
      },
    },
  });

  if (!message) {
    return null;
  }

  let body: string | null = null;
  let bodyType: "html" | "text" | null = null;

  if (message.s3HtmlKey) {
    body = await getObject(message.s3HtmlKey);
    bodyType = "html";
  }

  if (!body && message.s3TextKey) {
    body = await getObject(message.s3TextKey);
    bodyType = "text";
  }

  return {
    id: message.id,
    fromAddress: message.fromAddress,
    fromName: message.fromName,
    toAddress: message.toAddress,
    subject: message.subject,
    body,
    bodyType,
    receivedAt: message.receivedAt,
    attachments: message.attachments,
  };
}
