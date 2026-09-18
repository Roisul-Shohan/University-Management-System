export interface CreateCourseInput {
  code: string;
  name: string;
  credits: number;
  departmentId: string;
}

export interface UpdateCourseInput {
  code?: string;
  name?: string;
  credits?: number;
}

export interface GetCoursesQuery {
  departmentId?: string;
}
