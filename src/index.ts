import { env } from "./config/env.js";

function main() {
  console.log(`Inboxx server starting in ${env.NODE_ENV} mode...`);
  console.log(`Server will run on ${env.HOST}:${env.PORT}`);
}

main();
