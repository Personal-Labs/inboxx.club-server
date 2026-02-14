import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { getMessageById } from "../services/index.js";
import { AppError } from "../plugins/error-handler.js";
import { success } from "../types/response.js";

const paramsSchema = z.object({
  id: z.string(),
});

export async function getMessage(
  request: FastifyRequest<{
    Params: z.infer<typeof paramsSchema>;
  }>,
  reply: FastifyReply
) {
  const { id } = paramsSchema.parse(request.params);

  const message = await getMessageById(id);

  if (!message) {
    throw new AppError(404, "Message not found", "MESSAGE_NOT_FOUND");
  }

  return await reply.send(success(message));
}
