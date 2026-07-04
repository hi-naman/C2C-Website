/*
  Warnings:

  - A unique constraint covering the columns `[joinCode]` on the table `hackathon_teams` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `joinCode` to the `hackathon_teams` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "hackathon_teams" ADD COLUMN     "joinCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isProfileComplete" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_teams_joinCode_key" ON "hackathon_teams"("joinCode");
