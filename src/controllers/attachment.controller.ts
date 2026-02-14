import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { getAttachmentDownloadUrl } from "../services/index.js";
import { AppError } from "../plugins/error-handler.js";
import { success } from "../types/response.js";

const paramsSchema = z.object({
  id: z.string(),
});

export async function downloadAttachment(
  request: FastifyRequest<{
    Params: z.infer<typeof paramsSchema>;
  }>,
  reply: FastifyReply
) {
  const { id } = paramsSchema.parse(request.params);

  const attachment = await getAttachmentDownloadUrl(id);

  if (!attachment) {
    throw new AppError(404, "Attachment not found", "ATTACHMENT_NOT_FOUND");
  }

  return await reply.send(success(attachment));
}
