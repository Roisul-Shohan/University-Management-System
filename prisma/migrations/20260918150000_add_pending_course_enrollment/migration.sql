-- Add a pre-payment state for course selections.
ALTER TYPE "EnrollmentStatus" ADD VALUE 'PENDING' BEFORE 'ENROLLED';

ALTER TABLE "course_enrollments"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';
