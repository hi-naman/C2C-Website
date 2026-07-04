-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'SESSION';
ALTER TYPE "EventType" ADD VALUE 'CONTEST';

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "yearTarget" "YearTarget" NOT NULL DEFAULT 'ALL',
    "sessionId" TEXT,
    "contestId" TEXT,
    "campId" TEXT,
    "hackathonId" TEXT,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_sessionId_key" ON "calendar_events"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_contestId_key" ON "calendar_events"("contestId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_campId_key" ON "calendar_events"("campId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_hackathonId_key" ON "calendar_events"("hackathonId");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_campId_fkey" FOREIGN KEY ("campId") REFERENCES "camps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "hackathons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
