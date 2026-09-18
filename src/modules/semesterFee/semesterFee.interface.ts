export interface ICreateSemesterFee {
    programId: string;
    amount: number;
}

export interface IUpdateSemesterFee {
    amount?: number;
    isActive?: boolean;
}
