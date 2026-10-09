import { Router } from "express";
import { dashboardController } from "./dashboard.controller.js";
import { auth } from "../../middlewares/auth.js";

const router = Router();

router.get(
    "/stats",
    auth("SUPER_ADMIN", "TEACHER", "STUDENT"),
    dashboardController.getDashboardStats
);

router.get(
    "/activity",
    auth("SUPER_ADMIN", "TEACHER", "STUDENT"),
    dashboardController.getRecentActivity
);

router.get(
    "/schedule",
    auth("SUPER_ADMIN", "TEACHER", "STUDENT"),
    dashboardController.getSchedule
);

router.get(
    "/calendar/events",
    auth("SUPER_ADMIN", "TEACHER", "STUDENT"),
    dashboardController.getCalendarEvents
);

export const dashboardRoutes = router;
