PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO "new_User" ("id", "name", "email", "emailVerified", "image", "timezone", "createdAt", "updatedAt", "isAdmin")
SELECT
    "id",
    "name",
    "email",
    "emailVerified",
    "image",
    CASE
        WHEN "timezone" = 'UTC' OR "timezone" IS NULL OR TRIM("timezone") = '' THEN 'Asia/Shanghai'
        ELSE "timezone"
    END,
    "createdAt",
    "updatedAt",
    "isAdmin"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
