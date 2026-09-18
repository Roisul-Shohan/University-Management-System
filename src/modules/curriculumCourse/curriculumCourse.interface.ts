export interface CreateCurriculumCourseInput {
  programId: string;
  courseId: string;
  year: number;
  semester: number;
}

export interface UpdateCurriculumCourseInput {
  programId?: string;
  courseId?: string;
  year?: number;
  semester?: number;
}

export interface GetCurriculumCoursesQuery {
  programId?: string;
  year?: number;
  semester?: number;
}
