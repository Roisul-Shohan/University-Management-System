import { Worker } from "bullmq";
import { bullmqRedis } from "./lib/bullmq";
import { sendAcademicPeriodEmail } from "./utils/email";
import { prisma } from "./lib/prisma";
import { NotificationType } from "../generated/prisma/enums";

const worker = new Worker(
	"notification-queue",
	async (job) => {
		if (job.name !== "academic-period-opened") {
			return;
		}

		const { academicPeriodId } = job.data;

		const academicPeriod = await prisma.academicPeriod.findUnique({
			where: {
				id: academicPeriodId,
			},
		});

		if (!academicPeriod) {
			throw new Error("Academic period not found.");
		}

		const now = new Date();

		const isCurrentlyOpen =
			academicPeriod.isActive &&
			academicPeriod.startDate <= now &&
			academicPeriod.endDate >= now;

		if (!isCurrentlyOpen) {
			console.log(
				`Academic period ${academicPeriod.id} is not currently open.`,
			);

			return;
		}

		let users: any;

		if (academicPeriod.type === "ADMISSION") {
			users = await prisma.user.findMany({
				where: {
					OR: [
						{
							role: "TEACHER",
						},
						{
							role: "STUDENT",
							student: null,
						},
					],
				},
				select: {
					id: true,
					email: true,
					name: true,
				},
			});
		} else {
			users = await prisma.user.findMany({
				where: {
					role: "STUDENT",
					student: {
						isNot: null,
					},
				},
				select: {
					id: true,
					email: true,
					name: true,
				},
			});
		}

		const notificationType = getNotificationType(academicPeriod.type);

		const title = getNotificationTitle(academicPeriod.type);

		const message = getNotificationMessage(
			academicPeriod.type,
			academicPeriod.endDate,
		);

		for (const user of users) {
			const notification = await prisma.notification.upsert({
				where: {
					userId_academicPeriodId: {
						userId: user.id,
						academicPeriodId: academicPeriod.id,
					},
				},
				update: {},
				create: {
					userId: user.id,
					academicPeriodId: academicPeriod.id,
					title,
					message,
					type: notificationType,
				},
			});

			await sendAcademicPeriodEmail(
				user.email,
				user.name,
				title,
				message,
				academicPeriod.endDate,
			);

			console.log(
				`Notification processed for ${user.email}: ${notification.id}`,
			);
		}
	},
	{
		connection: bullmqRedis,
	},
);

worker.on("completed", (job) => {
	console.log(`Job ${job.id} completed.`);
});

worker.on("failed", (job, error) => {
	console.error(`Job ${job?.id} failed:`, error);
});

console.log("Notification worker started...");

const getNotificationType = (
	type:
		| NotificationType
		| "ADMISSION"
		| "SEMESTER_REGISTRATION"
		| "COURSE_REGISTRATION"
		| "MIDTERM_EXAM"
		| "FINAL_EXAM"
		| "RESULT_PUBLICATION",
) => {
	if (type === "ADMISSION") {
		return "ADMISSION";
	}

	if (type === "SEMESTER_REGISTRATION" || type === "COURSE_REGISTRATION") {
		return "REGISTRATION";
	}

	if (type === "MIDTERM_EXAM" || type === "FINAL_EXAM") {
		return "EXAM";
	}

	return "RESULT";
};

const getNotificationTitle = (
	type:
		| "ADMISSION"
		| "SEMESTER_REGISTRATION"
		| "COURSE_REGISTRATION"
		| "MIDTERM_EXAM"
		| "FINAL_EXAM"
		| "RESULT_PUBLICATION",
) => {
	if (type === "ADMISSION") {
		return "Admission is Open";
	}

	if (type === "SEMESTER_REGISTRATION") {
		return "Semester Registration is Open";
	}

	if (type === "COURSE_REGISTRATION") {
		return "Course Registration is Open";
	}

	if (type === "MIDTERM_EXAM") {
		return "Midterm Examination Period is Open";
	}

	if (type === "FINAL_EXAM") {
		return "Final Examination Period is Open";
	}

	return "Result Publication is Open";
};

const getNotificationMessage = (
	type:
		| "ADMISSION"
		| "SEMESTER_REGISTRATION"
		| "COURSE_REGISTRATION"
		| "MIDTERM_EXAM"
		| "FINAL_EXAM"
		| "RESULT_PUBLICATION",
	endDate: Date,
) => {
	const formattedEndDate = endDate.toLocaleDateString();

	if (type === "ADMISSION") {
		return `Admission is now open. You can apply until ${formattedEndDate}.`;
	}

	if (type === "SEMESTER_REGISTRATION") {
		return `Semester registration is now open. Registration will remain open until ${formattedEndDate}.`;
	}

	if (type === "COURSE_REGISTRATION") {
		return `Course registration is now open. Registration will remain open until ${formattedEndDate}.`;
	}

	if (type === "MIDTERM_EXAM") {
		return `The midterm examination period is now open and will remain open until ${formattedEndDate}.`;
	}

	if (type === "FINAL_EXAM") {
		return `The final examination period is now open and will remain open until ${formattedEndDate}.`;
	}

	return `Results are scheduled for publication during this period until ${formattedEndDate}.`;
};
