-- CreateTable
CREATE TABLE "semester_fees" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semester_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "semester_fees_programId_idx" ON "semester_fees"("programId");

-- CreateIndex
CREATE INDEX "semester_fees_isActive_idx" ON "semester_fees"("isActive");

-- AddForeignKey
ALTER TABLE "semester_fees" ADD CONSTRAINT "semester_fees_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
