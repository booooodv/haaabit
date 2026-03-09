import { createHash, randomBytes } from "node:crypto";

import type { PrismaClient } from "../generated/prisma/client";

export const API_DOCS_PATH = "/api/docs";
export const API_SPEC_PATH = "/api/openapi.json";

function generatePersonalApiToken() {
  return `haaabit_${randomBytes(24).toString("hex")}`;
}

function hashPersonalApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isLegacyStoredToken(token: string) {
  return token.startsWith("haaabit_");
}

export async function migrateLegacyPersonalApiTokens(db: PrismaClient) {
  const records = await db.apiToken.findMany({
    select: {
      id: true,
      token: true,
    },
  });

  const legacyRecords = records.filter((record) => isLegacyStoredToken(record.token));

  await Promise.all(
    legacyRecords.map((record) =>
      db.apiToken.update({
        where: {
          id: record.id,
        },
        data: {
          token: hashPersonalApiToken(record.token),
        },
      }),
    ),
  );
}

export async function getPersonalApiToken(db: PrismaClient, userId: string) {
  return db.apiToken.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function resetPersonalApiToken(db: PrismaClient, userId: string) {
  const token = generatePersonalApiToken();
  const tokenHash = hashPersonalApiToken(token);

  const record = await db.apiToken.upsert({
    where: {
      userId,
    },
    update: {
      token: tokenHash,
    },
    create: {
      userId,
      token: tokenHash,
    },
  });

  return {
    token,
    updatedAt: record.updatedAt,
  };
}

export async function findUserByApiToken(db: PrismaClient, token: string) {
  const record = await db.apiToken.findUnique({
    where: {
      token: hashPersonalApiToken(token),
    },
    include: {
      user: true,
    },
  });

  return record?.user ?? null;
}
