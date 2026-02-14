import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export function healthRoutes(fastify: FastifyInstance): void {
  fastify.get("/health", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      return await reply.send({
        status: "healthy",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      fastify.log.error(error, "Health check failed");
      return await reply.status(503).send({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      });
    }
  });
}
