export interface CreateStudentFromAdmissionParams {
	admissionId: string;
}

export interface GetStudentParams {
	studentId: string;
}

export interface GetStudentsQuery {
	programId?: string;
	departmentId?: string;
	admissionYear?: number;
	currentYear?: number;
	currentSemester?: number;
	isActive?: boolean;
}
