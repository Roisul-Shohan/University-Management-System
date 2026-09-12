export interface CreateDepartmentInput {
	name: string;
	code: string;
}

export interface UpdateDepartmentInput {
	name?: string;
	code?: string;
}