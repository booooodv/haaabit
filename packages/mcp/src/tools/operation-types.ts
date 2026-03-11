export type ToolOperationResult = {
  payload: unknown;
  summary: string;
};

export type ToolOperation = (input: unknown) => Promise<ToolOperationResult>;
