-- Add status column to academic_periods
ALTER TABLE "academic_periods" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ACTIVE', 'COMPLETED'));