import type { FastifyRequest, FastifyReply } from "fastify";
import { runCleanup, getCleanupStats } from "../services/cleanup.service.js";
import { success } from "../types/response.js";

export async function handleRunCleanup(_request: FastifyRequest, reply: FastifyReply) {
  const result = await runCleanup();
  return await reply.send(success(result));
}

export async function handleGetCleanupStats(_request: FastifyRequest, reply: FastifyReply) {
  const stats = await getCleanupStats();
  return await reply.send(success(stats));
}
