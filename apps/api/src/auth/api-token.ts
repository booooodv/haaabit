import { randomBytes } from "node:crypto";

import type { PrismaClient } from "../generated/prisma/client";

export const API_DOCS_PATH = "/api/docs";
export const API_SPEC_PATH = "/api/openapi.json";

function generatePersonalApiToken() {
  return `haaabit_${randomBytes(24).toString("hex")}`;
}

export async function getPersonalApiToken(db: PrismaClient, userId: string) {
  return db.apiToken.findUnique({
    where: {
      userId,
    },
  });
}

export async function resetPersonalApiToken(db: PrismaClient, userId: string) {
  const token = generatePersonalApiToken();

  return db.apiToken.upsert({
    where: {
      userId,
    },
    update: {
      token,
    },
    create: {
      userId,
      token,
    },
  });
}

export async function findUserByApiToken(db: PrismaClient, token: string) {
  const record = await db.apiToken.findUnique({
    where: {
      token,
    },
    include: {
      user: true,
    },
  });

  return record?.user ?? null;
}
