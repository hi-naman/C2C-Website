-- CreateEnum
CREATE TYPE "CampType" AS ENUM ('WINTER', 'SUMMER');

-- CreateTable
CREATE TABLE "camps" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "CampType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "maxSeats" INTEGER,
    "tags" TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "camps_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "camps" ADD CONSTRAINT "camps_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
