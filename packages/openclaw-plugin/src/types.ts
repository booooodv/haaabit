export type OpenClawToolHandler = (input: unknown) => Promise<Record<string, unknown>>;

export type OpenClawToolRegistration = {
  description: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
};

export type OpenClawPluginApi = {
  registerTool: (name: string, registration: OpenClawToolRegistration, handler: OpenClawToolHandler) => void;
};

export type NativeToolDefinition = {
  name: string;
  description: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
};

export type NativePluginConfig = {
  apiUrl: string;
  apiToken: string;
  timeoutMs: number;
};
