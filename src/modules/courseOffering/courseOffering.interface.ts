export interface CreateCourseOfferingInput {
  courseId: string;
  teacherId: string;
  year: number;
  semester: number;
  capacity?: number | null;
}

export interface UpdateCourseOfferingInput {
  teacherId?: string;
  year?: number;
  semester?: number;
  capacity?: number | null;
}

export interface GetCourseOfferingsQuery {
  courseId?: string;
  teacherId?: string;
  year?: number;
  semester?: number;
}
