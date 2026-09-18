export interface CourseRegistrationParams {
  studentSemesterId: string;
  userId: string;
}

export interface RegisterCourseParams extends CourseRegistrationParams {
  courseOfferingId: string;
}
