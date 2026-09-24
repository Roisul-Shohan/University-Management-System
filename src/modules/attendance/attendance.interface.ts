import type { AttendanceStatus } from "../../../generated/prisma/enums.js";

export interface OpenAttendanceSessionInput {
	classSessionId: string;
	durationMinutes?: number;
}

export interface MarkAttendanceInput {
	attendanceSessionId: string;
	qrToken: string;
}

export interface UpdateAttendanceRecordInput {
	status: AttendanceStatus;
}
