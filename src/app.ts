/** biome-ignore-all lint/style/useImportType: <explanation> */
/** biome-ignore-all assist/source/organizeImports: <explanation> */
/** biome-ignore-all lint/correctness/noUnusedImports: <explanation> */
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { notFound } from "./middlewares/notFound";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/users.route";
import { academicPeriodRouter } from "./modules/academicPeriod/academicPeriod.route";
import { notificationRouter } from "./modules/notifications/notification.route";

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

app.use(notFound);

app.use(globalErrorHandler);

export default app;
