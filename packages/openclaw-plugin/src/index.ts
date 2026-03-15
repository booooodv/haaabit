import { parsePluginEnv, resolvePluginRuntimeEnv } from "./config/env.js";
import { createNativeHandlers } from "./native-handlers.js";
import { formatStartupError, OpenClawPluginError } from "./errors.js";
import { registerTools } from "./register-tools.js";
import { createToolCatalog } from "./tool-catalog.js";
import type { NativePluginConfig, OpenClawPluginApi, OpenClawToolHandler } from "./types.js";

export { parsePluginEnv } from "./config/env.js";
export { createNativeHandlers } from "./native-handlers.js";
export { createToolCatalog, EXPECTED_TOOL_NAMES } from "./tool-catalog.js";
export { formatStartupError, OpenClawPluginError, redactSecrets } from "./errors.js";
export type { NativePluginConfig, NativeToolDefinition, OpenClawPluginApi, OpenClawToolHandler } from "./types.js";

export type PluginActivationOptions = {
  env?: unknown;
  config?: {
    env?: unknown;
  };
  fetch?: typeof fetch;
  handlers?: Partial<Record<string, OpenClawToolHandler>>;
};

export function activateHaaabitOpenClawPlugin(
  api: OpenClawPluginApi,
  options: PluginActivationOptions = {},
) {
  const env = resolvePluginRuntimeEnv(api, options);

  try {
    const config = parsePluginEnv(env);
    const catalog = createToolCatalog();
    const nativeHandlers = createNativeHandlers(config, {
      fetch: options.fetch,
    });

    for (const [toolName, handler] of Object.entries(options.handlers ?? {})) {
      if (handler) {
        nativeHandlers[toolName] = handler;
      }
    }

    const registeredTools = registerTools(api, {
      catalog,
      handlers: nativeHandlers,
    });

    return {
      config,
      registeredTools,
    };
  } catch (error) {
    if (error instanceof OpenClawPluginError) {
      throw error;
    }

    const payload = formatStartupError(error, env);
    throw new OpenClawPluginError({
      category: "startup",
      code: "PLUGIN_BOOTSTRAP_FAILED",
      message: payload.error.message,
      hint: payload.error.hint,
    });
  }
}

export function register(api: OpenClawPluginApi, options: PluginActivationOptions = {}) {
  return activateHaaabitOpenClawPlugin(api, options);
}

export function activate(api: OpenClawPluginApi, options: PluginActivationOptions = {}) {
  return register(api, options);
}

export default register;
