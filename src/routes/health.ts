import type { FastifyInstance } from "fastify";
import { healthCheck } from "../controllers/index.js";

export function healthRoutes(fastify: FastifyInstance): void {
  fastify.get("/health", healthCheck);
}
