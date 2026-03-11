import { parsePluginEnv } from "./config/env.js";
import { formatStartupError, OpenClawPluginError } from "./errors.js";
import { registerTools } from "./register-tools.js";
import { createToolCatalog } from "./tool-catalog.js";
import type { NativePluginConfig, OpenClawPluginApi, OpenClawToolHandler } from "./types.js";

export { parsePluginEnv } from "./config/env.js";
export { createToolCatalog, EXPECTED_TOOL_NAMES } from "./tool-catalog.js";
export { formatStartupError, OpenClawPluginError, redactSecrets } from "./errors.js";
export type { NativePluginConfig, NativeToolDefinition, OpenClawPluginApi, OpenClawToolHandler } from "./types.js";

export function activateHaaabitOpenClawPlugin(
  api: OpenClawPluginApi,
  options: {
    env?: NodeJS.ProcessEnv;
    handlers?: Partial<Record<string, OpenClawToolHandler>>;
  } = {},
) {
  try {
    const config = parsePluginEnv(options.env ?? process.env);
    const catalog = createToolCatalog();
    const registeredTools = registerTools(api, {
      catalog,
      config,
      handlers: options.handlers,
    });

    return {
      config,
      registeredTools,
    };
  } catch (error) {
    if (error instanceof OpenClawPluginError) {
      throw error;
    }

    const payload = formatStartupError(error, options.env ?? process.env);
    throw new OpenClawPluginError({
      category: "startup",
      code: "PLUGIN_BOOTSTRAP_FAILED",
      message: payload.error.message,
      hint: payload.error.hint,
    });
  }
}
