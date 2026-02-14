import type { FastifyInstance } from "fastify";
import { getMessage } from "../controllers/index.js";

export function messageRoutes(fastify: FastifyInstance): void {
  fastify.get("/message/:id", getMessage);
}
