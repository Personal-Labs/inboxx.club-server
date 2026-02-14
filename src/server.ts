import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { registerRoutes } from "./routes/index.js";

export async function buildServer() {
  const loggerConfig =
    env.NODE_ENV === "development"
      ? {
          level: "debug",
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
            },
          },
        }
      : { level: "info" };

  const fastify = Fastify({ logger: loggerConfig });

  // Register plugins
  await fastify.register(cors, { origin: true, credentials: true });
  await fastify.register(helmet, { contentSecurityPolicy: false });
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (request) => {
      const forwarded = request.headers["x-forwarded-for"];
      if (typeof forwarded === "string") {
        return forwarded.split(",")[0]?.trim() ?? request.ip;
      }
      return request.ip;
    },
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
        code: "RATE_LIMIT_EXCEEDED",
      },
    }),
  });
  registerErrorHandler(fastify);

  // Register routes
  await registerRoutes(fastify);

  return fastify;
}
