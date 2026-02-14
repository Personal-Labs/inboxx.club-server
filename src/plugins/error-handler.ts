import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { env } from "../config/env.js";
import { error } from "../types/response.js";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = "APP_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function registerErrorHandler(fastify: FastifyInstance): void {
  fastify.setErrorHandler(
    (err: FastifyError | AppError, _request: FastifyRequest, reply: FastifyReply) => {
      const statusCode = "statusCode" in err ? (err.statusCode ?? 500) : 500;
      const code = "code" in err && err.code ? err.code : "INTERNAL_ERROR";

      fastify.log.error(err);

      const message =
        statusCode >= 500 && env.NODE_ENV === "production" ? "Internal server error" : err.message;

      return reply.status(statusCode).send(error(message, code));
    }
  );
}
