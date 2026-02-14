import type { FastifyInstance } from "fastify";
import { downloadAttachment } from "../controllers/index.js";

export function attachmentRoutes(fastify: FastifyInstance): void {
  fastify.get("/attachment/:id/download", downloadAttachment);
}
