import type { NativeToolDefinition, OpenClawPluginApi, OpenClawToolHandler } from "./types.js";

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

    api.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
      },
      handler,
    );
    registered.push(tool.name);
  }

  return registered;
}
