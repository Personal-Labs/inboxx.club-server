import { prisma } from "../lib/prisma.js";
import { getPresignedUrl } from "../lib/s3.js";

export interface AttachmentDownload {
  url: string;
  filename: string;
  contentType: string;
  size: number;
}

export async function getAttachmentDownloadUrl(id: string): Promise<AttachmentDownload | null> {
  const attachment = await prisma.attachment.findUnique({
    where: { id },
  });

  if (!attachment) {
    return null;
  }

  const url = await getPresignedUrl(attachment.s3Key, 300);

  return {
    url,
    filename: attachment.filename,
    contentType: attachment.contentType,
    size: attachment.size,
  };
}
