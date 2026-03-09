import type { PrismaClient } from "../generated/prisma/client";

const APP_SETTINGS_ID = "global";

type RegistrationStatus = {
  registrationEnabled: boolean;
  hasUsers: boolean;
};

async function ensureAdministrator(db: PrismaClient) {
  const adminCount = await db.user.count({
    where: {
      isAdmin: true,
    },
  });

  if (adminCount > 0) {
    return;
  }

  const oldestUser = await db.user.findFirst({
    orderBy: [
      {
        createdAt: "asc",
      },
      {
        id: "asc",
      },
    ],
    select: {
      id: true,
    },
  });

  if (!oldestUser) {
    return;
  }

  await db.user.update({
    where: {
      id: oldestUser.id,
    },
    data: {
      isAdmin: true,
    },
  });
}

export async function ensureAppSettings(db: PrismaClient) {
  return db.appSettings.upsert({
    where: {
      id: APP_SETTINGS_ID,
    },
    update: {},
    create: {
      id: APP_SETTINGS_ID,
      registrationEnabled: true,
    },
  });
}

export async function getRegistrationStatus(db: PrismaClient): Promise<RegistrationStatus> {
  const userCount = await db.user.count();

  if (userCount === 0) {
    return {
      registrationEnabled: true,
      hasUsers: false,
    };
  }

  await ensureAdministrator(db);
  const settings = await ensureAppSettings(db);

  return {
    registrationEnabled: settings.registrationEnabled,
    hasUsers: true,
  };
}

export async function setRegistrationEnabled(db: PrismaClient, registrationEnabled: boolean) {
  return db.appSettings.upsert({
    where: {
      id: APP_SETTINGS_ID,
    },
    update: {
      registrationEnabled,
    },
    create: {
      id: APP_SETTINGS_ID,
      registrationEnabled,
    },
  });
}

export async function makeFirstUserAdmin(db: PrismaClient, userId: string) {
  await ensureAppSettings(db);

  const userCount = await db.user.count();

  if (userCount !== 1) {
    return;
  }

  await db.user.update({
    where: {
      id: userId,
    },
    data: {
      isAdmin: true,
    },
  });
}

export async function isUserAdmin(db: PrismaClient, userId: string) {
  await ensureAdministrator(db);

  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      isAdmin: true,
    },
  });

  return user?.isAdmin ?? false;
}

export async function promoteUserToAdmin(db: PrismaClient, userId: string) {
  await ensureAppSettings(db);

  return db.user.update({
    where: {
      id: userId,
    },
    data: {
      isAdmin: true,
    },
    select: {
      id: true,
      isAdmin: true,
    },
  });
}
