export interface CreateAdmissionPaymentParams {
	admissionId: string;
	userId: string;
}

export interface ExecutePaymentParams {
	paymentID: string;
	userId: string;
}
export interface GetPaymentStatusParams {
	transactionId: string;
	userId: string;
}
export interface BkashCallbackParams {
	paymentID: string;
	status?: string;
}
