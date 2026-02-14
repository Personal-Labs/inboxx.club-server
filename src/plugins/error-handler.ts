import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { env } from "../config/env.js";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function registerErrorHandler(fastify: FastifyInstance): void {
  fastify.setErrorHandler(
    (error: FastifyError | AppError, _request: FastifyRequest, reply: FastifyReply) => {
      const statusCode = "statusCode" in error ? (error.statusCode ?? 500) : 500;
      const code = "code" in error ? error.code : "INTERNAL_ERROR";

      fastify.log.error(error);

      return reply.status(statusCode).send({
        success: false,
        error: {
          message:
            statusCode >= 500 && env.NODE_ENV === "production"
              ? "Internal server error"
              : error.message,
          code,
        },
      });
    }
  );
}
