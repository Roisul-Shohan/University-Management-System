/*
  Warnings:

  - A unique constraint covering the columns `[userId,academicPeriodId]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StudentProgramStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED');

-- DropIndex
DROP INDEX "notifications_createdAt_idx";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "academicPeriodId" TEXT,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "programStatus" "StudentProgramStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_userId_academicPeriodId_key" ON "notifications"("userId", "academicPeriodId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "academic_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
