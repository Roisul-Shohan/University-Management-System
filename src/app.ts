/** biome-ignore-all lint/style/useImportType: <explanation> */
/** biome-ignore-all assist/source/organizeImports: <explanation> */
/** biome-ignore-all lint/correctness/noUnusedImports: <explanation> */
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { notFound } from "./middlewares/notFound.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.route.js";
import { academicPeriodRouter } from "./modules/academicPeriod/academicPeriod.route.js";
import { notificationRouter } from "./modules/notifications/notification.route.js";
import { departmentRouter } from "./modules/department/department.route.js";
import { admissionRoutes } from "./modules/admission/admission.routes.js";
import { paymentRoutes } from "./modules/payments/payment.route.js";
import { studentRoutes } from "./modules/students/student.route.js";
import { studentSemesterRoutes } from "./modules/studentSemester/studentSemester.routes.js";
import { semesterFeeRoutes } from "./modules/semesterFee/semesterFee.route.js";
import { admissionFeeRoutes } from "./modules/admissionFee/admissionFee.route.js";
import {
  creditFeeRoutes,
  courseRegistrationFeeRoutes,
} from "./modules/creditFee/creditFee.route.js";
import { courseRegistrationRoutes } from "./modules/courseRegistration/courseRegistration.route.js";
import { teacherRoutes } from "./modules/teachers/teacher.route.js";
import { courseRoutes } from "./modules/courses/course.route.js";
import { curriculumCourseRoutes } from "./modules/curriculumCourse/curriculumCourse.route.js";
import { programRoutes } from "./modules/programs/program.route.js";
import { courseOfferingRoutes } from "./modules/courseOffering/courseOffering.route.js";

const app: Application = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Helllo");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRouter);
app.use("/api/academic-periods", academicPeriodRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/departments", departmentRouter);
app.use("/api/payments", paymentRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/student-semesters", studentSemesterRoutes);
app.use("/api/semester-fees", semesterFeeRoutes);
app.use("/api/admission-fees", admissionFeeRoutes);
app.use("/api/credit-fees", creditFeeRoutes);
app.use("/api/course-registration-fees", courseRegistrationFeeRoutes);
app.use("/api/course-registrations", courseRegistrationRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/curriculum-courses", curriculumCourseRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/course-offerings", courseOfferingRoutes);

app.use(notFound);

app.use(globalErrorHandler);

export default app;
