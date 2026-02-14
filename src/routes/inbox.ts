import type { FastifyInstance } from "fastify";
import { getInbox, clearInbox } from "../controllers/index.js";

export function inboxRoutes(fastify: FastifyInstance): void {
  fastify.get("/inbox/:username", getInbox);
  fastify.delete("/inbox/:username", clearInbox);
}
