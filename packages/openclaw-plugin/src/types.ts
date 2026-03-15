import { z } from "zod";

export type ProviderSafeJsonSchema =
  | null
  | boolean
  | number
  | string
  | ProviderSafeJsonSchema[]
  | {
      [key: string]: ProviderSafeJsonSchema;
    };

export const nativeSuccessEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok: z.literal(true),
    toolName: z.string().min(1),
    summary: z.string(),
    data: dataSchema,
  });

export type NativeToolSuccessResult<TData extends Record<string, unknown> = Record<string, unknown>> = {
  ok: true;
  toolName: string;
  summary: string;
  data: TData;
};

export type NativeToolErrorResult = {
  ok: false;
  toolName: string;
  error: Record<string, unknown>;
};

export type OpenClawToolResult<TData extends Record<string, unknown> = Record<string, unknown>> =
  | NativeToolSuccessResult<TData>
  | NativeToolErrorResult;

export type OpenClawToolHandler = (input: unknown) => Promise<OpenClawToolResult>;

export type OpenClawToolContent = {
  type: "text";
  text: string;
};

export type OpenClawToolExecutionResult = {
  content: OpenClawToolContent[];
  details?: Record<string, unknown>;
};

export type OpenClawRegisteredTool = {
  name: string;
  description: string;
  parameters?: ProviderSafeJsonSchema;
  execute: (input: unknown) => Promise<OpenClawToolExecutionResult>;
};

export type OpenClawPluginApi = {
  registerTool: (tool: OpenClawRegisteredTool, options?: Record<string, unknown>) => void;
  config?: {
    env?: unknown;
  };
};

export type NativeToolDefinition = {
  name: string;
  description: string;
  inputSchema?: ProviderSafeJsonSchema;
  outputSchema?: ProviderSafeJsonSchema;
};

export type NativePluginConfig = {
  apiUrl: string;
  apiToken: string;
  timeoutMs: number;
};
