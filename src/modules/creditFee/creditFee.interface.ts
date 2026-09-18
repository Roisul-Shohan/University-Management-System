export interface ICreateCreditFee {
  programId: string;
  amount: number;
  isActive?: boolean;
}

export interface IUpdateCreditFee {
  amount?: number;
  isActive?: boolean;
}
