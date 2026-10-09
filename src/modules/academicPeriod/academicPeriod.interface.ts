import { AcademicPeriodType, AcademicPeriodStatus } from "../../../generated/prisma/enums.js";

export interface ICreateAcademicPeriod {
	type: AcademicPeriodType;
	startDate: Date;
	endDate: Date;
}

export interface IGetAcademicPeriodsQuery {
	page: number;
	limit: number;
	type?: AcademicPeriodType;
	isActive?: boolean;
	sortBy: "startDate" | "endDate" | "createdAt";
	sortOrder: "asc" | "desc";
}

export interface IUpdateAcademicPeriod {
	type?: AcademicPeriodType;
	startDate?: Date;
	endDate?: Date;
	status?: AcademicPeriodStatus;
}
export interface IUpdateAcademicPeriodStatus {
	isActive: boolean;
}
