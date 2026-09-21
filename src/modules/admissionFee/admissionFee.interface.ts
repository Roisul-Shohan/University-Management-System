export interface ICreateAdmissionFee {
  programId: string;
  amount: number;
  isActive?: boolean;
}

export interface IUpdateAdmissionFee {
  amount?: number;
  isActive?: boolean;
}
