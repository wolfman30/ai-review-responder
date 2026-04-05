-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleTokenExpiry" DATETIME,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "responseCountResetAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("alertsEnabled", "createdAt", "email", "googleAccessToken", "googleRefreshToken", "googleTokenExpiry", "id", "stripeCustomerId", "tier", "updatedAt") SELECT "alertsEnabled", "createdAt", "email", "googleAccessToken", "googleRefreshToken", "googleTokenExpiry", "id", "stripeCustomerId", "tier", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
