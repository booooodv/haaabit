import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AnySchema, ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import packageJson from "../../package.json";

import { HaaabitApiClient } from "../client/api-client.js";
import { createDiscoveryHandlers } from "../tools/inventory.js";
import { registerGuidance, type GuidancePromptDefinition, type GuidanceResourceDefinition } from "./guidance.js";

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
    inputSchema?: AnySchema | ZodRawShapeCompat;
    outputSchema: AnySchema | ZodRawShapeCompat;
    handler: (input: unknown) => Promise<CallToolResult>;
  }>;
  listRegisteredPrompts: () => GuidancePromptDefinition[];
  listRegisteredResources: () => GuidanceResourceDefinition[];
};

export function createServer(options: CreateServerOptions): HaaabitMcpServer {
  const metadata = {
    name: packageJson.name,
    version: packageJson.version,
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
        outputSchema: augmentOutputSchema(tool.outputSchema),
      },
      tool.handler,
    );
  }

  const guidance = registerGuidance(server);

  return {
    server,
    metadata,
    config: options,
    listRegisteredTools: () => registeredTools,
    listRegisteredPrompts: () => guidance.prompts,
    listRegisteredResources: () => guidance.resources,
  };
}

function augmentOutputSchema(outputSchema: AnySchema | ZodRawShapeCompat | undefined) {
  if (outputSchema instanceof z.ZodObject) {
    return outputSchema.extend({
      _haaabit_json: z.string().optional(),
    });
  }

  return outputSchema;
}
