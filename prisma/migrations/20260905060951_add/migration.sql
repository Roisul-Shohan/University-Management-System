/*
  Warnings:

  - Added the required column `currentSemester` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentYear` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programId` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `teachers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DegreeType" AS ENUM ('BSC', 'MSC', 'PHD');

-- CreateEnum
CREATE TYPE "StudentSemesterStatus" AS ENUM ('PENDING', 'REGISTERED', 'ACTIVE', 'COMPLETED', 'DROPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AcademicPeriodType" AS ENUM ('ADMISSION', 'SEMESTER_REGISTRATION', 'COURSE_REGISTRATION', 'MIDTERM_EXAM', 'FINAL_EXAM', 'RESULT_PUBLICATION');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ADMISSION', 'SEMESTER_REGISTRATION', 'COURSE_REGISTRATION', 'EXAM');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'COMPLETED', 'DROPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "AttendanceSessionStatus" AS ENUM ('OPEN', 'CLOSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('MIDTERM', 'FINAL');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('GENERAL', 'ADMISSION', 'REGISTRATION', 'COURSE', 'EXAM', 'RESULT', 'PAYMENT');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "currentSemester" INTEGER NOT NULL,
ADD COLUMN     "currentYear" INTEGER NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "programId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "departmentId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "academic_periods" (
    "id" TEXT NOT NULL,
    "type" "AcademicPeriodType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admissions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "admissionYear" INTEGER NOT NULL,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "attendanceSessionId" TEXT NOT NULL,
    "courseEnrollmentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceSessionStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_sessions" (
    "id" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "topic" TEXT,
    "meetingLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "studentSemesterId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "droppedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_offerings" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_prerequisites" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_courses" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "type" "ExamType" NOT NULL,
    "title" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentSemesterId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "score" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_questions" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "marks" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_scales" (
    "id" TEXT NOT NULL,
    "minMark" DOUBLE PRECISION NOT NULL,
    "letter" TEXT NOT NULL,
    "gradePoint" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "degreeType" "DegreeType" NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "courseEnrollmentId" TEXT NOT NULL,
    "marks" DECIMAL(5,2) NOT NULL,
    "letterGrade" TEXT NOT NULL,
    "gradePoint" DECIMAL(3,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_answers" (
    "id" TEXT NOT NULL,
    "examAttemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_semesters" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "status" "StudentSemesterStatus" NOT NULL DEFAULT 'PENDING',
    "registeredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentSemesterId" TEXT,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academic_periods_type_idx" ON "academic_periods"("type");

-- CreateIndex
CREATE INDEX "academic_periods_startDate_endDate_idx" ON "academic_periods"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "admissions_studentId_idx" ON "admissions"("studentId");

-- CreateIndex
CREATE INDEX "admissions_programId_idx" ON "admissions"("programId");

-- CreateIndex
CREATE INDEX "admissions_admissionYear_idx" ON "admissions"("admissionYear");

-- CreateIndex
CREATE INDEX "admissions_status_idx" ON "admissions"("status");

-- CreateIndex
CREATE INDEX "attendance_records_attendanceSessionId_idx" ON "attendance_records"("attendanceSessionId");

-- CreateIndex
CREATE INDEX "attendance_records_courseEnrollmentId_idx" ON "attendance_records"("courseEnrollmentId");

-- CreateIndex
CREATE INDEX "attendance_records_status_idx" ON "attendance_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_attendanceSessionId_courseEnrollmentId_key" ON "attendance_records"("attendanceSessionId", "courseEnrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sessions_classSessionId_key" ON "attendance_sessions"("classSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sessions_qrToken_key" ON "attendance_sessions"("qrToken");

-- CreateIndex
CREATE INDEX "attendance_sessions_classSessionId_idx" ON "attendance_sessions"("classSessionId");

-- CreateIndex
CREATE INDEX "attendance_sessions_expiresAt_idx" ON "attendance_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "attendance_sessions_status_idx" ON "attendance_sessions"("status");

-- CreateIndex
CREATE INDEX "class_sessions_courseOfferingId_idx" ON "class_sessions"("courseOfferingId");

-- CreateIndex
CREATE INDEX "class_sessions_date_idx" ON "class_sessions"("date");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE INDEX "courses_departmentId_idx" ON "courses"("departmentId");

-- CreateIndex
CREATE INDEX "course_enrollments_studentSemesterId_idx" ON "course_enrollments"("studentSemesterId");

-- CreateIndex
CREATE INDEX "course_enrollments_courseOfferingId_idx" ON "course_enrollments"("courseOfferingId");

-- CreateIndex
CREATE INDEX "course_enrollments_status_idx" ON "course_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_studentSemesterId_courseOfferingId_key" ON "course_enrollments"("studentSemesterId", "courseOfferingId");

-- CreateIndex
CREATE INDEX "course_offerings_courseId_idx" ON "course_offerings"("courseId");

-- CreateIndex
CREATE INDEX "course_offerings_teacherId_idx" ON "course_offerings"("teacherId");

-- CreateIndex
CREATE INDEX "course_offerings_year_semester_idx" ON "course_offerings"("year", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "course_offerings_courseId_teacherId_year_semester_key" ON "course_offerings"("courseId", "teacherId", "year", "semester");

-- CreateIndex
CREATE INDEX "course_prerequisites_courseId_idx" ON "course_prerequisites"("courseId");

-- CreateIndex
CREATE INDEX "course_prerequisites_prerequisiteId_idx" ON "course_prerequisites"("prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "course_prerequisites_courseId_prerequisiteId_key" ON "course_prerequisites"("courseId", "prerequisiteId");

-- CreateIndex
CREATE INDEX "curriculum_courses_programId_year_semester_idx" ON "curriculum_courses"("programId", "year", "semester");

-- CreateIndex
CREATE INDEX "curriculum_courses_courseId_idx" ON "curriculum_courses"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_courses_programId_courseId_key" ON "curriculum_courses"("programId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "exams_courseOfferingId_idx" ON "exams"("courseOfferingId");

-- CreateIndex
CREATE INDEX "exams_type_idx" ON "exams"("type");

-- CreateIndex
CREATE INDEX "exams_status_idx" ON "exams"("status");

-- CreateIndex
CREATE INDEX "exam_attempts_examId_idx" ON "exam_attempts"("examId");

-- CreateIndex
CREATE INDEX "exam_attempts_studentSemesterId_idx" ON "exam_attempts"("studentSemesterId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempts_examId_studentSemesterId_key" ON "exam_attempts"("examId", "studentSemesterId");

-- CreateIndex
CREATE INDEX "exam_questions_examId_idx" ON "exam_questions"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_questions_examId_order_key" ON "exam_questions"("examId", "order");

-- CreateIndex
CREATE INDEX "grading_scales_minMark_idx" ON "grading_scales"("minMark");

-- CreateIndex
CREATE UNIQUE INDEX "grading_scales_minMark_key" ON "grading_scales"("minMark");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "programs_departmentId_idx" ON "programs"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "programs_departmentId_degreeType_key" ON "programs"("departmentId", "degreeType");

-- CreateIndex
CREATE INDEX "question_options_questionId_idx" ON "question_options"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_questionId_order_key" ON "question_options"("questionId", "order");

-- CreateIndex
CREATE INDEX "results_courseEnrollmentId_idx" ON "results"("courseEnrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "results_courseEnrollmentId_key" ON "results"("courseEnrollmentId");

-- CreateIndex
CREATE INDEX "student_answers_questionId_idx" ON "student_answers"("questionId");

-- CreateIndex
CREATE INDEX "student_answers_optionId_idx" ON "student_answers"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "student_answers_examAttemptId_questionId_key" ON "student_answers"("examAttemptId", "questionId");

-- CreateIndex
CREATE INDEX "student_semesters_studentId_idx" ON "student_semesters"("studentId");

-- CreateIndex
CREATE INDEX "student_semesters_year_semester_idx" ON "student_semesters"("year", "semester");

-- CreateIndex
CREATE INDEX "student_semesters_status_idx" ON "student_semesters"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_semesters_studentId_year_semester_key" ON "student_semesters"("studentId", "year", "semester");

-- CreateIndex
CREATE INDEX "transactions_studentId_idx" ON "transactions"("studentId");

-- CreateIndex
CREATE INDEX "transactions_studentSemesterId_idx" ON "transactions"("studentSemesterId");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "students_programId_idx" ON "students"("programId");

-- CreateIndex
CREATE INDEX "students_currentYear_currentSemester_idx" ON "students"("currentYear", "currentSemester");

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_attendanceSessionId_fkey" FOREIGN KEY ("attendanceSessionId") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_courseEnrollmentId_fkey" FOREIGN KEY ("courseEnrollmentId") REFERENCES "course_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "course_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "course_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_studentSemesterId_fkey" FOREIGN KEY ("studentSemesterId") REFERENCES "student_semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_courses" ADD CONSTRAINT "curriculum_courses_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_courses" ADD CONSTRAINT "curriculum_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "course_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_studentSemesterId_fkey" FOREIGN KEY ("studentSemesterId") REFERENCES "student_semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_courseEnrollmentId_fkey" FOREIGN KEY ("courseEnrollmentId") REFERENCES "course_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_examAttemptId_fkey" FOREIGN KEY ("examAttemptId") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "exam_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_semesters" ADD CONSTRAINT "student_semesters_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_studentSemesterId_fkey" FOREIGN KEY ("studentSemesterId") REFERENCES "student_semesters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
