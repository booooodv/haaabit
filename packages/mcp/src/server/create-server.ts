import { createRequire } from "node:module";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { HaaabitApiClient } from "../client/api-client.js";
import { createDiscoveryHandlers } from "../tools/inventory.js";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json") as {
  name: string;
  version: string;
};

export type CreateServerOptions = {
  apiUrl: string;
  apiToken: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
};

export type HaaabitMcpServer = {
  server: McpServer;
  metadata: {
    name: string;
    version: string;
  };
  config: CreateServerOptions;
  listRegisteredTools: () => Array<{
    name: string;
    method: "GET" | "POST" | "PATCH";
    path: string;
    description: string;
    inputSchema?: unknown;
    outputSchema: unknown;
    handler: (input: unknown) => Promise<unknown>;
  }>;
};

export function createServer(options: CreateServerOptions): HaaabitMcpServer {
  const metadata = {
    name: pkg.name,
    version: pkg.version,
  };
  const server = new McpServer(metadata);
  const client = new HaaabitApiClient({
    apiUrl: options.apiUrl,
    apiToken: options.apiToken,
    timeoutMs: options.timeoutMs ?? 10_000,
    fetch: options.fetch,
  });
  const registeredTools = createDiscoveryHandlers({
    client,
  });

  for (const tool of registeredTools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
      },
      tool.handler,
    );
  }

  return {
    server,
    metadata,
    config: options,
    listRegisteredTools: () => registeredTools,
  };
}
