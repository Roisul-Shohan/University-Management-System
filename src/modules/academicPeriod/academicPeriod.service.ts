/** biome-ignore-all lint/style/useImportType: <explanation> */
/** biome-ignore-all assist/source/organizeImports: <explanation> */
import { prisma } from "../../lib/prisma.js";
import AppError from "../../errors/AppErrors.js";
import {
	ICreateAcademicPeriod,
	IGetAcademicPeriodsQuery,
	IUpdateAcademicPeriod,
	IUpdateAcademicPeriodStatus,
} from "./academicPeriod.interface.js";
import { notificationQueue } from "../../queues/notification.queue.js";

export const createAcademicPeriod = async (data: ICreateAcademicPeriod) => {
	const { type, startDate, endDate } = data;

	const existingPeriod = await prisma.academicPeriod.findFirst({
		where: {
			type,
			startDate: {
				lte: endDate,
			},
			endDate: {
				gte: startDate,
			},
		},
	});

	if (existingPeriod) {
		throw new AppError(
			400,
			"Another academic period of this type already exists during this time.",
		);
	}

	const academicPeriod = await prisma.academicPeriod.create({
		data: {
			type,
			startDate,
			endDate,
			isActive: false,
		},
	});

	return academicPeriod;
};

export const getAcademicPeriods = async (query: IGetAcademicPeriodsQuery) => {
	const { page, limit, type, isActive, sortBy, sortOrder } = query;

	const skip = (page - 1) * limit;

	const whereCondition: {
		type?: IGetAcademicPeriodsQuery["type"];
		isActive?: boolean;
	} = {};

	if (type) {
		whereCondition.type = type;
	}

	if (isActive !== undefined) {
		whereCondition.isActive = isActive;
	}

	const [academicPeriods, total] = await Promise.all([
		prisma.academicPeriod.findMany({
			where: whereCondition,
			skip,
			take: limit,

			orderBy: {
				[sortBy]: sortOrder,
			},
		}),

		prisma.academicPeriod.count({
			where: whereCondition,
		}),
	]);

	return {
		data: academicPeriods,
		meta: {
			page,
			limit,
			total,
		},
	};
};

export const getAcademicPeriodById = async (id: string) => {
	const academicPeriod = await prisma.academicPeriod.findUnique({
		where: {
			id,
		},
	});

	if (!academicPeriod) {
		throw new AppError(404, "Academic period not found.");
	}

	return academicPeriod;
};

export const updateAcademicPeriod = async (
	id: string,
	data: IUpdateAcademicPeriod,
) => {
	const existingPeriod = await prisma.academicPeriod.findUnique({
		where: {
			id,
		},
	});

	if (!existingPeriod) {
		throw new AppError(404, "Academic period not found.");
	}

	const startDate = data.startDate ?? existingPeriod.startDate;
	const endDate = data.endDate ?? existingPeriod.endDate;

	if (startDate >= endDate) {
		throw new AppError(400, "Start date must be before end date.");
	}

	const type = data.type ?? existingPeriod.type;

	const overlappingPeriod = await prisma.academicPeriod.findFirst({
		where: {
			id: {
				not: id,
			},
			type,
			startDate: {
				lte: endDate,
			},
			endDate: {
				gte: startDate,
			},
		},
	});

	if (overlappingPeriod) {
		throw new AppError(
			400,
			"Another academic period of this type already exists during this time.",
		);
	}

	const academicPeriod = await prisma.academicPeriod.update({
		where: {
			id,
		},
		data: {
			type: data.type,
			startDate: data.startDate,
			endDate: data.endDate,
		},
	});

	if (academicPeriod.isActive && !existingPeriod.isActive) {
		const now = new Date();

		const isCurrentlyOpen =
			academicPeriod.startDate <= now && academicPeriod.endDate >= now;

		if (isCurrentlyOpen) {
			await notificationQueue.add(
				"academic-period-opened",
				{
					academicPeriodId: academicPeriod.id,
				},
				{
					jobId: `academic-period-opened-${academicPeriod.id}`,
				},
			);
		}
	}

	return academicPeriod;
};

export const updateAcademicPeriodStatus = async (
	id: string,
	data: IUpdateAcademicPeriodStatus,
) => {
	const existingPeriod = await prisma.academicPeriod.findUnique({
		where: {
			id,
		},
	});

	if (!existingPeriod) {
		throw new AppError(404, "Academic period not found.");
	}

	if (existingPeriod.isActive === data.isActive) {
		throw new AppError(
			400,
			`Academic period is already ${data.isActive ? "active" : "inactive"}.`,
		);
	}

	if (data.isActive) {
		const activePeriod = await prisma.academicPeriod.findFirst({
			where: {
				type: existingPeriod.type,
				isActive: true,
				id: {
					not: id,
				},
			},
		});

		if (activePeriod) {
			throw new AppError(
				400,
				"Another academic period of this type is already active.",
			);
		}
	}

	const academicPeriod = await prisma.academicPeriod.update({
		where: {
			id,
		},
		data: {
			isActive: data.isActive,
		},
	});

	if (!existingPeriod.isActive && academicPeriod.isActive) {
		const now = new Date();

		if (academicPeriod.startDate <= now) {
			await notificationQueue.add(
				"academic-period-opened",
				{
					academicPeriodId: academicPeriod.id,
				},
				{
					jobId: `academic-period-opened-${academicPeriod.id}`,
				},
			);
		} else {
			const delay = academicPeriod.startDate.getTime() - now.getTime();

			await notificationQueue.add(
				"academic-period-opened",
				{
					academicPeriodId: academicPeriod.id,
				},
				{
					jobId: `academic-period-opened-${academicPeriod.id}`,
					delay,
				},
			);
		}
	}
	return academicPeriod;
};

export const getCurrentAcademicPeriods = async () => {
	const now = new Date();

	const periods = await prisma.academicPeriod.findMany({
		where: {
			isActive: true,
			startDate: {
				lte: now,
			},
			endDate: {
				gte: now,
			},
		},
		orderBy: {
			type: "asc",
		},
	});

	return periods;
};
