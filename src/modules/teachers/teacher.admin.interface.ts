export interface GetTeachersQuery {
  departmentId?: string;
  isDeptAdmin?: boolean;
}

export interface UpdateTeacherAdminInput {
  teacherId: string;
  isDeptAdmin: boolean;
}
