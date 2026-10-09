export interface GetTeachersQuery {
  departmentId?: string;
  isDeptAdmin?: boolean;
}

export interface UpdateTeacherAdminInput {
  teacherId: string;
  isDeptAdmin: boolean;
}

export interface UpdateTeacherStatusInput {
  teacherId: string;
  status: "ACTIVE" | "DISABLED" | "SUSPENDED";
}
