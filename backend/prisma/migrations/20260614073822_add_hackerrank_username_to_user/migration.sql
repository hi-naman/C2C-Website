/*
  Warnings:

  - A unique constraint covering the columns `[hackerrankUsername]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hackerrankUsername" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_hackerrankUsername_key" ON "users"("hackerrankUsername");
