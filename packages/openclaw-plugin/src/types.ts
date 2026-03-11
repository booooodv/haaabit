import { z } from "zod";

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
