import type { TeacherApplicationStatus } from "../../../generated/prisma/enums.js";

export interface ApplyAsTeacherInput {
  userId: string;
  departmentId: string;
  joiningYear: number;
}

export interface ReviewTeacherApplicationInput {
  applicationId: string;
  reviewerId: string;
}

export interface RejectTeacherApplicationInput extends ReviewTeacherApplicationInput {
  rejectionReason?: string;
}

export interface GetTeacherApplicationsQuery {
  reviewerId: string;
  status?: TeacherApplicationStatus;
}
