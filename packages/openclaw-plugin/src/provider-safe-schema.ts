import { z } from "zod";

import type { ProviderSafeJsonSchema } from "./types.js";

const STRIPPED_SCHEMA_KEYS = new Set(["$schema", "default", "examples", "example"]);

export function toProviderSafeJsonSchema(schema?: z.ZodTypeAny): ProviderSafeJsonSchema | undefined {
  if (!schema) {
    return undefined;
  }

  return sanitizeJsonSchema(z.toJSONSchema(schema));
}

function sanitizeJsonSchema(value: unknown): ProviderSafeJsonSchema {
  if (typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonSchema(item));
  }

  if (value && typeof value === "object") {
    const sanitizedEntries = Object.entries(value).flatMap(([key, nestedValue]) => {
      if (STRIPPED_SCHEMA_KEYS.has(key)) {
        return [];
      }

      return [[key, sanitizeJsonSchema(nestedValue)]];
    });

    return Object.fromEntries(sanitizedEntries);
  }

  return value as ProviderSafeJsonSchema;
}
