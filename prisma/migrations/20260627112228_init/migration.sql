-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "tzName" TEXT NOT NULL,
    "placeName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chart" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "inputHash" TEXT NOT NULL,
    "facts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reading" (
    "id" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "kbVersion" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KbVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "notes" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KbVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KbRule" (
    "id" TEXT NOT NULL,
    "kbVersionId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "reading" TEXT NOT NULL,
    "sourceWork" TEXT NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "tradition" TEXT NOT NULL DEFAULT 'Parashari',

    CONSTRAINT "KbRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Chart_inputHash_key" ON "Chart"("inputHash");

-- CreateIndex
CREATE INDEX "Chart_profileId_idx" ON "Chart"("profileId");

-- CreateIndex
CREATE INDEX "Reading_chartId_idx" ON "Reading"("chartId");

-- CreateIndex
CREATE UNIQUE INDEX "Reading_chartId_kbVersion_key" ON "Reading"("chartId", "kbVersion");

-- CreateIndex
CREATE UNIQUE INDEX "KbVersion_version_key" ON "KbVersion"("version");

-- CreateIndex
CREATE INDEX "KbVersion_version_idx" ON "KbVersion"("version");

-- CreateIndex
CREATE INDEX "KbRule_subject_idx" ON "KbRule"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "KbRule_kbVersionId_ruleKey_key" ON "KbRule"("kbVersionId", "ruleKey");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chart" ADD CONSTRAINT "Chart_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reading" ADD CONSTRAINT "Reading_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "Chart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KbRule" ADD CONSTRAINT "KbRule_kbVersionId_fkey" FOREIGN KEY ("kbVersionId") REFERENCES "KbVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
