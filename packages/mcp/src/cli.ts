#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { formatStartupError, parseConfig } from "./config/env.js";
import { createServer } from "./server/create-server.js";

async function main() {
  const config = parseConfig({
    env: process.env,
    argv: process.argv.slice(2),
  });
  const server = createServer(config);
  const transport = new StdioServerTransport();

  await server.server.connect(transport);
}

main().catch((error) => {
  formatStartupError(error, process.env);
  process.exitCode = 1;
});
