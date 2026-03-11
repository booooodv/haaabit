import type { NativePluginConfig, NativeToolDefinition, OpenClawPluginApi, OpenClawToolHandler } from "./types.js";

export function registerTools(
  api: OpenClawPluginApi,
  options: {
    catalog: NativeToolDefinition[];
    config: NativePluginConfig;
    handlers?: Partial<Record<string, OpenClawToolHandler>>;
  },
) {
  const registered: string[] = [];

  for (const tool of options.catalog) {
    api.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
      },
      options.handlers?.[tool.name] ?? createDeferredHandler(tool.name, options.config),
    );
    registered.push(tool.name);
  }

  return registered;
}

function createDeferredHandler(toolName: string, config: NativePluginConfig): OpenClawToolHandler {
  return async () => ({
    ok: false,
    error: {
      category: "not_implemented",
      code: "PHASE_27_PENDING",
      message: `${toolName} is registered natively, but its direct Haaabit API handler is deferred to Phase 27.`,
      hint: `Native plugin config is ready for ${config.apiUrl}; finish the API-backed handler in Phase 27.`,
    },
  });
}
