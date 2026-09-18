-- CreateTable
CREATE TABLE "credit_fees" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_fees_programId_idx" ON "credit_fees"("programId");

-- CreateIndex
CREATE INDEX "credit_fees_isActive_idx" ON "credit_fees"("isActive");

-- AddForeignKey
ALTER TABLE "credit_fees" ADD CONSTRAINT "credit_fees_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
