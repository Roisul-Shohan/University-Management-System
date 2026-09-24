import { z } from "zod";

const id = z.string().min(1, "ID is required");

export const openAttendanceValidation = z.object({
	body: z.object({
		classSessionId: id,
		durationMinutes: z.number().int().positive().max(240).optional(),
	}),
});

export const attendanceSessionIdValidation = z.object({
	params: z.object({ id }),
});

export const markAttendanceValidation = z.object({
	params: z.object({ id }),
	body: z.object({
		qrToken: z.string().min(1, "QR token is required"),
	}),
});

export const updateAttendanceRecordValidation = z.object({
	params: z.object({ sessionId: id, recordId: id }),
	body: z.object({
		status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
	}),
});
