import type { FastifyInstance } from "fastify";
import { z } from "zod";

const DEFAULT_CORS_ORIGIN = "http://localhost:3000";

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  CORS_ORIGIN: z.string().default(DEFAULT_CORS_ORIGIN),
});

export type AppEnv = ReturnType<typeof createEnv>;

declare module "fastify" {
  interface FastifyInstance {
    env: AppEnv;
  }
}

export function createEnv(source: NodeJS.ProcessEnv): {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CORS_ORIGIN: string;
  corsOrigins: string[];
} {
  const parsed = rawEnvSchema.parse(source);

  return {
    ...parsed,
    corsOrigins: parsed.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}

export async function registerEnv(app: FastifyInstance, overrides: Partial<NodeJS.ProcessEnv> = {}): Promise<void> {
  const env = createEnv({
    ...process.env,
    ...overrides,
  });

  app.decorate("env", env);
}
