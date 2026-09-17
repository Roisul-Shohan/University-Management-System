/*
  Warnings:

  - A unique constraint covering the columns `[bkashPaymentId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bkashTrxId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "bkashPaymentId" TEXT,
ADD COLUMN     "bkashTrxId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_bkashPaymentId_key" ON "transactions"("bkashPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_bkashTrxId_key" ON "transactions"("bkashTrxId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
