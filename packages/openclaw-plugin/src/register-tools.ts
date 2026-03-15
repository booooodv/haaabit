import type {
  NativeToolDefinition,
  OpenClawPluginApi,
  OpenClawToolExecutionResult,
  OpenClawToolHandler,
  OpenClawToolResult,
} from "./types.js";

export function registerTools(
  api: OpenClawPluginApi,
  options: {
    catalog: NativeToolDefinition[];
    handlers: Record<string, OpenClawToolHandler>;
  },
) {
  const registered: string[] = [];

  for (const tool of options.catalog) {
    const handler = options.handlers[tool.name];

    if (!handler) {
      throw new Error(`Missing native handler for tool ${tool.name}`);
    }

    api.registerTool({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
      async execute(input: unknown): Promise<OpenClawToolExecutionResult> {
        const result = await handler(input);

        return toOpenClawExecuteResult(result);
      },
    });
    registered.push(tool.name);
  }

  return registered;
}

function toOpenClawExecuteResult(result: OpenClawToolResult): OpenClawToolExecutionResult {
  return {
    content: [
      {
        type: "text",
        text: formatContentText(result),
      },
    ],
    details: result,
  };
}

function formatContentText(result: OpenClawToolResult): string {
  if (result.ok) {
    return result.summary;
  }

  const message = getTextField(result.error.message, "Tool execution failed.") ?? "Tool execution failed.";
  const hint = getTextField(result.error.hint);

  return hint ? `${message}\n${hint}` : message;
}

function getTextField(value: unknown, fallback?: string): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
