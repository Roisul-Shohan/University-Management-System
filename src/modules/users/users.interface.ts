export interface GetUsersQuery {
	page: number;
	limit: number;
	search?: string;
	role?: "STUDENT" | "TEACHER" | "SUPER_ADMIN";
	status?: "ACTIVE" | "SUSPENDED" | "DISABLED";
	sortBy: "name" | "email" | "createdAt" | "updatedAt";
	sortOrder: "asc" | "desc";
}

export interface UpdateProfileInput {
	name?: string;
	address?: string;
	email?: string;
	password?: string;
}
