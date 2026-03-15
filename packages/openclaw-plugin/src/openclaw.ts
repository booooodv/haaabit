import { resolvePluginRuntimeEnv } from "./config/env.js";
import { activateHaaabitOpenClawPlugin } from "./index.js";
import type { OpenClawPluginApi } from "./types.js";
import type { PluginActivationOptions } from "./index.js";

export function register(api: OpenClawPluginApi, options: PluginActivationOptions = {}) {
  return activateHaaabitOpenClawPlugin(api, {
    ...options,
    env: resolvePluginRuntimeEnv(api, options),
  });
}

export function activate(api: OpenClawPluginApi, options: PluginActivationOptions = {}) {
  return register(api, options);
}

export { activateHaaabitOpenClawPlugin };

export default register;
