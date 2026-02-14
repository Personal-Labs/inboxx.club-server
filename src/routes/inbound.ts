import type { FastifyInstance } from "fastify";
import {
  handleSesNotification,
  handleRawEmail,
  handleSimpleWebhook,
} from "../controllers/inbound.controller.js";

export function inboundRoutes(fastify: FastifyInstance): void {
  // SES -> S3 -> SNS notification endpoint
  fastify.post("/inbound/ses", handleSesNotification);

  // Simple webhook with s3Key
  fastify.post("/inbound/webhook", handleSimpleWebhook);

  // Direct raw email submission (for testing)
  fastify.post("/inbound/raw", handleRawEmail);
}
