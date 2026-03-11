import { HaaabitApiClient } from "../../mcp/src/client/api-client.js";
import { HaaabitApiError } from "../../mcp/src/client/errors.js";
import { toToolErrorPayload } from "../../mcp/src/client/error-payload.js";
import { adaptToolResult } from "../../mcp/src/tools/result-adapters.js";
import { createToolOperations } from "../../mcp/src/tools/runtime.js";

import type { NativePluginConfig, OpenClawToolHandler } from "./types.js";

export function createNativeHandlers(
  config: NativePluginConfig,
  options: {
    fetch?: typeof fetch;
  } = {},
): Record<string, OpenClawToolHandler> {
  const client = new HaaabitApiClient({
    apiUrl: config.apiUrl,
    apiToken: config.apiToken,
    timeoutMs: config.timeoutMs,
    fetch: options.fetch,
  });
  const operations = createToolOperations({
    client,
  });

  return Object.fromEntries(
    Object.entries(operations).map(([toolName, operation]) => [
      toolName,
      async (input: unknown) => {
        try {
          const { payload, summary } = await operation(input);
          const data = adaptToolResult(toolName, payload);

          if (!isRecord(data)) {
            throw new Error(`Expected object data for tool ${toolName}`);
          }

          return {
            ok: true,
            summary,
            data,
          };
        } catch (error) {
          if (error instanceof HaaabitApiError) {
            return {
              ok: false,
              error: toToolErrorPayload(error, {
                toolName,
              }),
            };
          }

          throw error;
        }
      },
    ]),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
