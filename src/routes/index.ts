import type { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.js";
import { inboxRoutes } from "./inbox.js";
import { messageRoutes } from "./message.js";
import { attachmentRoutes } from "./attachment.js";
import { inboundRoutes } from "./inbound.js";

async function v1Routes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(healthRoutes);
  await fastify.register(inboxRoutes);
  await fastify.register(messageRoutes);
  await fastify.register(attachmentRoutes);
  await fastify.register(inboundRoutes);
}

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(v1Routes, { prefix: "/api/v1" });
}
