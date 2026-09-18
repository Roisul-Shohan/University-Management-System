import type { DegreeType } from "../../../generated/prisma/enums.js";

export interface CreateProgramInput {
	departmentId: string;
	degreeType: DegreeType;
}

export interface UpdateProgramInput {
	degreeType?: DegreeType;
}

export interface GetProgramsQuery {
	departmentId?: string;
}
