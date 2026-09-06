/*
  Warnings:

  - You are about to drop the column `studentId` on the `admissions` table. All the data in the column will be lost.
  - Added the required column `admissionFee` to the `admissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `admissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "AdmissionStatus" ADD VALUE 'APPROVED';

-- DropForeignKey
ALTER TABLE "admissions" DROP CONSTRAINT "admissions_studentId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_studentId_fkey";

-- DropIndex
DROP INDEX "admissions_studentId_idx";

-- AlterTable
ALTER TABLE "admissions" DROP COLUMN "studentId",
ADD COLUMN     "admissionFee" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "admissionId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "studentId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "admission_fees" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admission_fees_programId_idx" ON "admission_fees"("programId");

-- CreateIndex
CREATE INDEX "admission_fees_isActive_idx" ON "admission_fees"("isActive");

-- CreateIndex
CREATE INDEX "admissions_userId_idx" ON "admissions"("userId");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_admissionId_idx" ON "transactions"("admissionId");

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_fees" ADD CONSTRAINT "admission_fees_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
