-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "geminiApiKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" DATETIME
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "duration" INTEGER,
    "analysisResult" TEXT NOT NULL,
    "speakerMappings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "meetings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shared_meetings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "shared_meetings_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "meetings_userId_idx" ON "meetings"("userId");

-- CreateIndex
CREATE INDEX "meetings_createdAt_idx" ON "meetings"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "shared_meetings_shareToken_key" ON "shared_meetings"("shareToken");

-- CreateIndex
CREATE INDEX "shared_meetings_shareToken_idx" ON "shared_meetings"("shareToken");

-- CreateIndex
CREATE INDEX "shared_meetings_meetingId_idx" ON "shared_meetings"("meetingId");
