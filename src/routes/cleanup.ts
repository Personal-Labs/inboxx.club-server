import type { FastifyInstance } from "fastify";
import { handleRunCleanup, handleGetCleanupStats } from "../controllers/cleanup.controller.js";

export function cleanupRoutes(fastify: FastifyInstance): void {
  // Get cleanup stats (what would be deleted)
  fastify.get("/cleanup/stats", handleGetCleanupStats);

  // Run cleanup (delete expired data)
  fastify.post("/cleanup/run", handleRunCleanup);
}
