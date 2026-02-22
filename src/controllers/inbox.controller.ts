import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { listMessages, deleteInbox, isReservedUsername } from "../services/index.js";
import { isValidUsername, normalizeUsername } from "../utils/username.js";
import { AppError } from "../plugins/error-handler.js";
import { success } from "../types/response.js";

const paramsSchema = z.object({
  username: z.string(),
});

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export async function getInbox(
  request: FastifyRequest<{
    Params: z.infer<typeof paramsSchema>;
    Querystring: z.infer<typeof querySchema>;
  }>,
  reply: FastifyReply
) {
  const params = paramsSchema.parse(request.params);
  const query = querySchema.parse(request.query);

  const username = normalizeUsername(params.username);

  if (!isValidUsername(username)) {
    throw new AppError(400, "Invalid username format", "INVALID_USERNAME");
  }

  if (isReservedUsername(username)) {
    throw new AppError(403, "This username is reserved and cannot be used", "RESERVED_USERNAME");
  }

  const result = await listMessages(username, {
    limit: query.limit,
    cursor: query.cursor,
  });

  return await reply.send(success(result));
}

export async function clearInbox(
  request: FastifyRequest<{
    Params: z.infer<typeof paramsSchema>;
  }>,
  reply: FastifyReply
) {
  const params = paramsSchema.parse(request.params);
  const username = normalizeUsername(params.username);

  if (!isValidUsername(username)) {
    throw new AppError(400, "Invalid username format", "INVALID_USERNAME");
  }

  const deleted = await deleteInbox(username);

  if (!deleted) {
    throw new AppError(404, "Inbox not found", "INBOX_NOT_FOUND");
  }

  return await reply.send(success({ deleted: true }));
}
