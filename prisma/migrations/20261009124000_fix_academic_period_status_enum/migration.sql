-- Drop and recreate the status column with enum type
ALTER TABLE "academic_periods" DROP COLUMN IF EXISTS "status";
ALTER TABLE "academic_periods" ADD COLUMN "status" "AcademicPeriodStatus" NOT NULL DEFAULT 'UPCOMING';