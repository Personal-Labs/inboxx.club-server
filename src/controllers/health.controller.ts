import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import { success, error } from "../types/response.js";

export async function healthCheck(_request: FastifyRequest, reply: FastifyReply) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return await reply.send(
      success({
        status: "healthy",
        timestamp: new Date().toISOString(),
      })
    );
  } catch {
    return await reply.status(503).send(error("Database connection failed", "DB_UNHEALTHY"));
  }
}
