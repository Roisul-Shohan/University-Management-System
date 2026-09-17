export interface CreateAdmissionParams {
	userId: string;
	programId: string;
	admissionYear: number;
}

export interface ReviewAdmissionParams {
	admissionId: string;
	userId: string;
}
