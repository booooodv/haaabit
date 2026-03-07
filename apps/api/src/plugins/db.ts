import type { FastifyInstance } from "fastify";
import { PrismaLibSql } from "@prisma/adapter-libsql";

import { PrismaClient } from "../generated/prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    db: PrismaClient;
  }
}

export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaLibSql({
    url: databaseUrl,
  });

  return new PrismaClient({ adapter });
}

export async function registerDb(app: FastifyInstance, prisma?: PrismaClient): Promise<void> {
  const db = prisma ?? createPrismaClient(app.env.DATABASE_URL);
  const ownsClient = prisma === undefined;

  app.decorate("db", db);

  app.addHook("onClose", async () => {
    if (ownsClient) {
      await db.$disconnect();
    }
  });
}
