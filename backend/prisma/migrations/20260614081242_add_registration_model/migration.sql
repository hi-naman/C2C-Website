-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CAMP', 'HACKATHON');

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campId" TEXT,
    "hackathonId" TEXT,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registrations_userId_campId_key" ON "registrations"("userId", "campId");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_userId_hackathonId_key" ON "registrations"("userId", "hackathonId");

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_campId_fkey" FOREIGN KEY ("campId") REFERENCES "camps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "hackathons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
