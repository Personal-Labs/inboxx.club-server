import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { success, error } from "../types/response.js";

export function healthRoutes(fastify: FastifyInstance): void {
  fastify.get("/health", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      return await reply.send(
        success({
          status: "healthy",
          timestamp: new Date().toISOString(),
        })
      );
    } catch (err) {
      fastify.log.error(err, "Health check failed");
      return await reply.status(503).send(error("Database connection failed", "DB_UNHEALTHY"));
    }
  });
}
