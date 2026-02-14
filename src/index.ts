import { env } from "./config/env.js";
import { buildServer } from "./server.js";

async function main() {
  const server = await buildServer();

  try {
    await server.listen({ port: env.PORT, host: env.HOST });
    server.log.info(`Server running at http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

main().catch(console.error);
