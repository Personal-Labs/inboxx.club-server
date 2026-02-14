import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { processInboundEmail, processInboundEmailFromRaw } from "../services/inbound.service.js";
import { AppError } from "../plugins/error-handler.js";
import { success } from "../types/response.js";

// Schema for SES S3 notification
const sesS3NotificationSchema = z.object({
  Records: z.array(
    z.object({
      s3: z.object({
        bucket: z.object({
          name: z.string(),
        }),
        object: z.object({
          key: z.string(),
        }),
      }),
    })
  ),
});

// Schema for direct raw email submission
const rawEmailSchema = z.object({
  rawEmail: z.string().min(1),
});

// Handle SES -> S3 -> SNS/Lambda notification
export async function handleSesNotification(request: FastifyRequest, reply: FastifyReply) {
  const body = sesS3NotificationSchema.safeParse(request.body);

  if (!body.success) {
    throw new AppError(400, "Invalid SES notification format", "INVALID_NOTIFICATION");
  }

  const results = [];

  for (const record of body.data.Records) {
    const s3Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    try {
      const result = await processInboundEmail(s3Key);
      results.push({ s3Key, success: true, ...result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      results.push({ s3Key, success: false, error: errorMessage });
    }
  }

  return await reply.send(success({ processed: results }));
}

// Handle direct raw email submission (for testing or alternative integrations)
export async function handleRawEmail(request: FastifyRequest, reply: FastifyReply) {
  const body = rawEmailSchema.safeParse(request.body);

  if (!body.success) {
    throw new AppError(400, "Invalid request body", "INVALID_BODY");
  }

  const result = await processInboundEmailFromRaw(body.data.rawEmail);

  return await reply.send(success(result));
}

// Simple webhook for SES with just s3Key
const simpleWebhookSchema = z.object({
  s3Key: z.string().min(1),
});

export async function handleSimpleWebhook(request: FastifyRequest, reply: FastifyReply) {
  const body = simpleWebhookSchema.safeParse(request.body);

  if (!body.success) {
    throw new AppError(400, "Invalid request body", "INVALID_BODY");
  }

  const result = await processInboundEmail(body.data.s3Key);

  return await reply.send(success(result));
}
