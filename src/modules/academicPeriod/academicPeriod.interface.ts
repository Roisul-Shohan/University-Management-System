import { AcademicPeriodType } from "../../../generated/prisma/enums";

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
}
export interface IUpdateAcademicPeriodStatus {
	isActive: boolean;
}
