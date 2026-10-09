import { Request, Response, NextFunction } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { prisma } from "../../lib/prisma.js";
import { AdmissionStatus, ExamStatus, EnrollmentStatus, StudentSemesterStatus, Role } from "../../../generated/prisma/enums.js";

const getAdminDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const totalStudents = await prisma.student.count({ where: { isActive: true } });
    const activeCourses = await prisma.course.count();
    const pendingAdmissions = await prisma.admission.count({ where: { status: AdmissionStatus.PENDING } });
    const feeCollections = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: "SUCCESS" }
    });
    const totalTeachers = await prisma.user.count({ where: { role: Role.TEACHER } });
    const totalPrograms = await prisma.program.count();

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Admin dashboard stats retrieved successfully",
        data: {
            totalStudents,
            studentsChange: "5.2%",
            activeCourses,
            coursesChange: "1.2%",
            pendingAdmissions,
            admissionsChange: "15%",
            feeCollection: feeCollections._sum.amount || 0,
            feeCollectionChange: "8.5%",
            totalTeachers,
            totalPrograms,
        },
    });
});

const getTeacherDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const teacher = await prisma.teacher.findUnique({ where: { id: req.user!.userId } });
    if (!teacher) {
        return sendResponse(res, { statusCode: 200, success: true, message: "Teacher profile not found", data: {} });
    }

    const myCourses = await prisma.courseOffering.count({
        where: { teacherId: teacher.id }
    });
    const myStudents = await prisma.courseEnrollment.count({
        where: {
            courseOffering: { teacherId: teacher.id },
            status: EnrollmentStatus.ENROLLED
        }
    });
    const myExams = await prisma.exam.count({
        where: {
            courseOffering: { teacherId: teacher.id },
            status: ExamStatus.PUBLISHED
        }
    });
    const pendingGrades = await prisma.examAttempt.count({
        where: {
            exam: { courseOffering: { teacherId: teacher.id } },
            submittedAt: { not: null },
            score: null
        }
    });

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Teacher dashboard stats retrieved successfully",
        data: {
            myCourses,
            myStudents,
            myExams,
            pendingGrades,
        },
    });
});

const getStudentDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const student = await prisma.student.findUnique({ where: { id: req.user!.userId } });
    if (!student) {
        return sendResponse(res, { statusCode: 200, success: true, message: "Student profile not found", data: {} });
    }

    const activeSemester = await prisma.studentSemester.findFirst({
        where: {
            studentId: student.id,
            status: { in: [StudentSemesterStatus.REGISTERED, StudentSemesterStatus.ACTIVE] }
        },
        include: {
            courseEnrollments: {
                where: { status: EnrollmentStatus.ENROLLED },
                include: { courseOffering: { include: { course: true } } }
            }
        }
    });

    const enrolledCourses = activeSemester?.courseEnrollments.length || 0;
    const completedEnrollments = await prisma.courseEnrollment.findMany({
        where: { studentSemester: { studentId: student.id }, status: EnrollmentStatus.COMPLETED },
        include: { courseOffering: { include: { course: { select: { credits: true } } } } }
    });
    const completedCredits = completedEnrollments.reduce((sum, e) => sum + (e.courseOffering?.course?.credits || 0), 0);
    const upcomingExams = await prisma.exam.count({
        where: {
            courseOfferingId: { in: activeSemester?.courseEnrollments.map(c => c.courseOfferingId) || [] },
            status: ExamStatus.PUBLISHED,
            startAt: { gte: new Date() }
        }
    });
    const pendingPayments = await prisma.transaction.count({
        where: { userId: req.user!.userId, status: "PENDING" }
    });

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Student dashboard stats retrieved successfully",
        data: {
            enrolledCourses,
            completedCredits,
            upcomingExams,
            pendingPayments,
        },
    });
});

const getAdminRecentActivity = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const recentAdmissions = await prisma.admission.findMany({
        take: 3, orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } }, program: { include: { department: true } } }
    });
    const recentPayments = await prisma.transaction.findMany({
        take: 3, orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } }
    });
    const recentUsers = await prisma.user.findMany({
        take: 3, orderBy: { createdAt: "desc" },
        select: { name: true, email: true, role: true, createdAt: true }
    });

    const activity = [
        ...recentAdmissions.map(a => ({ title: "New admission", detail: `${a.user.name} \u00b7 ${a.program.degreeType} ${a.program.department.name}`, time: a.createdAt, tone: "violet" })),
        ...recentPayments.filter(p => p.status === "SUCCESS").map(p => ({ title: "Payment received", detail: `${p.user.name} \u00b7 ${p.type} fee`, time: p.createdAt, tone: "emerald" })),
        ...recentUsers.map(u => ({ title: "New user registered", detail: `${u.name} (${u.role})`, time: u.createdAt, tone: "blue" })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    sendResponse(res, { statusCode: 200, success: true, message: "Admin activity retrieved", data: activity });
});

const getTeacherRecentActivity = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const teacher = await prisma.teacher.findUnique({ where: { id: req.user!.userId } });
    if (!teacher) return sendResponse(res, { statusCode: 200, success: true, message: "Teacher not found", data: [] });

    const recentSubmissions = await prisma.examAttempt.findMany({
        take: 3, orderBy: { submittedAt: "desc" },
        where: { exam: { courseOffering: { teacherId: teacher.id } }, submittedAt: { not: null } },
        include: {
            studentSemester: {
                include: {
                    student: {
                        include: { user: { select: { name: true } } }
                    }
                }
            },
            exam: { select: { title: true } }
        }
    });
    const recentEnrollments = await prisma.courseEnrollment.findMany({
        take: 3, orderBy: { createdAt: "desc" },
        where: { courseOffering: { teacherId: teacher.id }, status: EnrollmentStatus.ENROLLED },
        include: {
            studentSemester: {
                include: {
                    student: {
                        include: { user: { select: { name: true } } }
                    }
                }
            },
            courseOffering: { include: { course: { select: { code: true } } } }
        }
    });

    const activity = [
        ...recentSubmissions.map(a => ({ title: "Exam submitted", detail: `${a.studentSemester.student.user.name} \u00b7 ${a.exam.title}`, time: a.submittedAt!, tone: "violet" })),
        ...recentEnrollments.map(e => ({ title: "New enrollment", detail: `${e.studentSemester.student.user.name} \u00b7 ${e.courseOffering.course.code}`, time: e.createdAt, tone: "blue" })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    sendResponse(res, { statusCode: 200, success: true, message: "Teacher activity retrieved", data: activity });
});

const getStudentRecentActivity = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const student = await prisma.student.findUnique({ where: { id: req.user!.userId } });
    if (!student) return sendResponse(res, { statusCode: 200, success: true, message: "Student not found", data: [] });

    const myPayments = await prisma.transaction.findMany({
        take: 3, orderBy: { createdAt: "desc" },
        where: { userId: req.user!.userId },
        select: { type: true, amount: true, status: true, createdAt: true }
    });
    const myExamAttempts = await prisma.examAttempt.findMany({
        take: 3, orderBy: { submittedAt: "desc" },
        where: { studentSemester: { studentId: student.id }, submittedAt: { not: null } },
        include: { exam: { select: { title: true } } }
    });
    const myGrades = await prisma.courseEnrollment.findMany({
        take: 3, orderBy: { updatedAt: "desc" },
        where: { studentSemester: { studentId: student.id }, status: EnrollmentStatus.COMPLETED },
        include: { courseOffering: { include: { course: { select: { code: true, name: true } } } } }
    });

    const activity = [
        ...myPayments.filter(p => p.status === "SUCCESS").map(p => ({ title: "Payment completed", detail: `${p.type} \u00b7 \u09f3${p.amount}`, time: p.createdAt, tone: "emerald" })),
        ...myExamAttempts.map(a => ({ title: "Exam submitted", detail: a.exam.title, time: a.submittedAt!, tone: "violet" })),
        ...myGrades.map(g => ({ title: "Grade posted", detail: `${g.courseOffering.course.code} \u00b7 ${g.courseOffering.course.name}`, time: g.updatedAt, tone: "blue" })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    sendResponse(res, { statusCode: 200, success: true, message: "Student activity retrieved", data: activity });
});

const getAdminSchedule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const schedule = [
        { time: "09:00", period: "AM", title: "Admin meeting", detail: "Conference Room A", color: "blue" },
        { time: "11:00", period: "AM", title: "Admissions review", detail: "Review pending applications", color: "violet" },
        { time: "02:00", period: "PM", title: "Finance sync", detail: "Fee collection update", color: "amber" },
    ];
    sendResponse(res, { statusCode: 200, success: true, message: "Admin schedule retrieved", data: schedule });
});

const getTeacherSchedule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const teacher = await prisma.teacher.findUnique({ where: { id: req.user!.userId } });
    if (!teacher) return sendResponse(res, { statusCode: 200, success: true, message: "Teacher not found", data: [] });

    const sessions = await prisma.classSession.findMany({
        take: 5, orderBy: { startTime: "asc" },
        where: { courseOffering: { teacherId: teacher.id }, startTime: { gte: new Date() } },
        include: { courseOffering: { include: { course: { select: { code: true, name: true } } } } }
    });

    const schedule = sessions.map(s => ({
        time: s.startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        period: s.startTime.getHours() < 12 ? "AM" : "PM",
        title: s.topic || `${s.courseOffering.course.code} class`,
        detail: `${s.courseOffering.course.code} \u00b7 ${s.courseOffering.course.name}`,
        color: "blue",
    }));

    sendResponse(res, { statusCode: 200, success: true, message: "Teacher schedule retrieved", data: schedule });
});

const getStudentSchedule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const student = await prisma.student.findUnique({ where: { id: req.user!.userId } });
    if (!student) return sendResponse(res, { statusCode: 200, success: true, message: "Student not found", data: [] });

    const activeSemester = await prisma.studentSemester.findFirst({
        where: { studentId: student.id, status: { in: [StudentSemesterStatus.REGISTERED, StudentSemesterStatus.ACTIVE] } },
        include: {
            courseEnrollments: {
                where: { status: EnrollmentStatus.ENROLLED },
                include: {
                    courseOffering: {
                        include: {
                            classSession: {
                                where: { startTime: { gte: new Date() } },
                                orderBy: { startTime: "asc" },
                                take: 5,
                                include: { courseOffering: { include: { course: { select: { code: true, name: true } } } } }
                            }
                        }
                    }
                }
            }
        }
    });

    const sessions = activeSemester?.courseEnrollments.flatMap(c => c.courseOffering.classSession) || [];
    sessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const schedule = sessions.slice(0, 5).map(s => ({
        time: s.startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        period: s.startTime.getHours() < 12 ? "AM" : "PM",
        title: s.topic || `${s.courseOffering.course.code} class`,
        detail: `${s.courseOffering.course.code} \u00b7 ${s.courseOffering.course.name}`,
        color: "emerald",
    }));

    sendResponse(res, { statusCode: 200, success: true, message: "Student schedule retrieved", data: schedule });
});

const getCalendarEvents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const role = req.user!.role;

    if (role === "STUDENT") {
        const student = await prisma.student.findUnique({ where: { id: req.user!.userId } });
        if (!student) return sendResponse(res, { statusCode: 200, success: true, message: "Student not found", data: [] });

        const activeSemester = await prisma.studentSemester.findFirst({
            where: { studentId: student.id, status: { in: [StudentSemesterStatus.REGISTERED, StudentSemesterStatus.ACTIVE] } },
            include: {
                courseEnrollments: {
                    where: { status: EnrollmentStatus.ENROLLED },
                    include: {
                        courseOffering: {
                            include: {
                                classSession: {
                                    where: { startTime: { gte: new Date() } },
                                    include: { courseOffering: { include: { course: { select: { code: true, name: true } } } } }
                                }
                            }
                        }
                    }
                }
            }
        });

        const sessions = activeSemester?.courseEnrollments.flatMap(c => c.courseOffering.classSession) || [];
        const exams = await prisma.exam.findMany({
            where: {
                courseOfferingId: { in: activeSemester?.courseEnrollments.map(c => c.courseOfferingId) || [] },
                status: ExamStatus.PUBLISHED,
                startAt: { gte: new Date() }
            },
            include: { courseOffering: { include: { course: { select: { code: true, name: true } } } } }
        });

        const events = [
            ...sessions.map(s => ({
                id: s.id,
                title: s.topic || `${s.courseOffering.course.code} class`,
                description: `${s.courseOffering.course.code} \u00b7 ${s.courseOffering.course.name}`,
                type: "class" as const,
                start: s.startTime.toISOString(),
                end: new Date(s.startTime.getTime() + 60 * 60 * 1000).toISOString(),
                location: s.meetingLink,
            })),
            ...exams.map(e => ({
                id: e.id,
                title: e.title,
                description: `${e.courseOffering.course.code} \u00b7 ${e.courseOffering.course.name}`,
                type: "exam" as const,
                start: e.startAt?.toISOString() ?? new Date().toISOString(),
                end: e.startAt ? new Date(e.startAt.getTime() + e.durationMinutes * 60 * 1000).toISOString() : new Date().toISOString(),
            }))
        ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        return sendResponse(res, { statusCode: 200, success: true, message: "Calendar events retrieved", data: events });
    }

    if (role === "TEACHER") {
        const teacher = await prisma.teacher.findUnique({ where: { id: req.user!.userId } });
        if (!teacher) return sendResponse(res, { statusCode: 200, success: true, message: "Teacher not found", data: [] });

        const sessions = await prisma.classSession.findMany({
            where: { teacherId: teacher.id, startTime: { gte: new Date() } },
            include: { courseOffering: { include: { course: { select: { code: true, name: true } } } } }
        });
        const exams = await prisma.exam.findMany({
            where: { courseOffering: { teacherId: teacher.id }, status: ExamStatus.PUBLISHED, startAt: { gte: new Date() } },
            include: { courseOffering: { include: { course: { select: { code: true, name: true } } } } }
        });

        const events = [
            ...sessions.map(s => ({
                id: s.id,
                title: s.topic || `${s.courseOffering.course.code} class`,
                description: `${s.courseOffering.course.code} \u00b7 ${s.courseOffering.course.name}`,
                type: "class" as const,
                start: s.startTime.toISOString(),
                end: new Date(s.startTime.getTime() + 60 * 60 * 1000).toISOString(),
                location: s.meetingLink,
            })),
            ...exams.map(e => ({
                id: e.id,
                title: e.title,
                description: `${e.courseOffering.course.code} \u00b7 ${e.courseOffering.course.name}`,
                type: "exam" as const,
                start: e.startAt?.toISOString() ?? new Date().toISOString(),
                end: e.startAt ? new Date(e.startAt.getTime() + e.durationMinutes * 60 * 1000).toISOString() : new Date().toISOString(),
            }))
        ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        return sendResponse(res, { statusCode: 200, success: true, message: "Calendar events retrieved", data: events });
    }

    if (role === "SUPER_ADMIN") {
        const sessions = await prisma.classSession.findMany({
            where: { startTime: { gte: new Date() } },
            take: 50,
            include: { courseOffering: { include: { course: { select: { code: true, name: true } }, teacher: { include: { user: { select: { name: true } } } } } } }
        });
        const exams = await prisma.exam.findMany({
            where: { status: ExamStatus.PUBLISHED, startAt: { gte: new Date() } },
            take: 50,
            include: { courseOffering: { include: { course: { select: { code: true, name: true } } } } }
        });

        const events = [
...sessions.map(s => ({
                id: s.id,
                title: s.topic || `${s.courseOffering.course.code} class`,
                description: `${s.courseOffering.course.code} \u00b7 ${s.courseOffering.course.name}`,
                type: "class" as const,
                start: s.startTime.toISOString(),
                end: new Date(s.startTime.getTime() + 60 * 60 * 1000).toISOString(),
                location: s.meetingLink,
            })),
            ...exams.map(e => ({
                id: e.id,
                title: e.title,
                description: `${e.courseOffering.course.code} \u00b7 ${e.courseOffering.course.name}`,
                type: "exam" as const,
                start: e.startAt?.toISOString() ?? new Date().toISOString(),
                end: e.startAt ? new Date(e.startAt.getTime() + e.durationMinutes * 60 * 1000).toISOString() : new Date().toISOString(),
            }))
        ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        return sendResponse(res, { statusCode: 200, success: true, message: "Calendar events retrieved", data: events });
    }

    return sendResponse(res, { statusCode: 200, success: true, message: "Unknown role", data: [] });
});

const getDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const role = req.user!.role;
    if (role === "SUPER_ADMIN") return getAdminDashboardStats(req, res, next);
    if (role === "TEACHER") return getTeacherDashboardStats(req, res, next);
    if (role === "STUDENT") return getStudentDashboardStats(req, res, next);
    return sendResponse(res, { statusCode: 200, success: true, message: "Unknown role", data: {} });
});

const getRecentActivity = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const role = req.user!.role;
    if (role === "SUPER_ADMIN") return getAdminRecentActivity(req, res, next);
    if (role === "TEACHER") return getTeacherRecentActivity(req, res, next);
    if (role === "STUDENT") return getStudentRecentActivity(req, res, next);
    return sendResponse(res, { statusCode: 200, success: true, message: "Unknown role", data: [] });
});

const getSchedule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const role = req.user!.role;
    if (role === "SUPER_ADMIN") return getAdminSchedule(req, res, next);
    if (role === "TEACHER") return getTeacherSchedule(req, res, next);
    if (role === "STUDENT") return getStudentSchedule(req, res, next);
    return sendResponse(res, { statusCode: 200, success: true, message: "Unknown role", data: [] });
});

export const dashboardController = {
    getDashboardStats,
    getRecentActivity,
    getSchedule,
    getCalendarEvents,
    getAdminDashboardStats,
    getTeacherDashboardStats,
    getStudentDashboardStats,
    getAdminRecentActivity,
    getTeacherRecentActivity,
    getStudentRecentActivity,
    getAdminSchedule,
    getTeacherSchedule,
    getStudentSchedule,
};