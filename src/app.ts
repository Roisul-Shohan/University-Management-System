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

app.use(notFound);

app.use(globalErrorHandler);

export default app;
