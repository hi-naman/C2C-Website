-- CreateEnum
CREATE TYPE "YearTarget" AS ENUM ('FIRST', 'SECOND', 'THIRD', 'FOURTH', 'ALL');

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "speakerName" TEXT NOT NULL,
    "speakerBio" TEXT,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "recordingUrl" TEXT,
    "slidesUrl" TEXT,
    "tags" TEXT[],
    "yearTarget" "YearTarget" NOT NULL DEFAULT 'ALL',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
