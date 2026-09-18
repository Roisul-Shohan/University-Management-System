
import AppError from "../../errors/AppErrors.js";
import {
	AdmissionStatus,
	StudentProgramStatus,
	StudentSemesterStatus,
	UserStatus,
} from "../../../generated/prisma/enums.js";
import { Prisma } from "../../../generated/prisma/client.js";
import {
	CreateStudentFromAdmissionParams,
	GetStudentParams,
	GetStudentsQuery,
} from "./student.interface.js";
import { prisma } from "../../lib/prisma.js";

const MAX_RETRIES = 3;


const createStudentTransaction = async (
	admissionId: string,
) => {
	return prisma.$transaction(
		async (tx) => {
			// -------------------------------------------------
			// 1. Get admission
			// -------------------------------------------------

			const admission = await tx.admission.findUnique({
				where: {
					id: admissionId,
				},
				include: {
					program: {
						include: {
							department: true,
						},
					},
					user: {
						select: {
							id: true,
							status: true,
						},
					},
				},
			});

			if (!admission) {
				throw new AppError(
					404,
					"Admission not found.",
				);
			}

			// -------------------------------------------------
			// 2. Admission must already be confirmed
			// -------------------------------------------------

			if (
				admission.status !==
				AdmissionStatus.CONFIRMED
			) {
				throw new AppError(
					400,
					"Student can only be created from a confirmed admission.",
				);
			}

			// -------------------------------------------------
			// 3. User must be active
			// -------------------------------------------------

			if (
				admission.user.status !==
				UserStatus.ACTIVE
			) {
				throw new AppError(
					400,
					"Student user account is not active.",
				);
			}

			// -------------------------------------------------
			// 4. Check if student already exists
			// -------------------------------------------------

			const existingStudent =
				await tx.student.findUnique({
					where: {
						id: admission.userId,
					},
					include: {
						program: {
							include: {
								department: true,
							},
						},
						semesters: {
							orderBy: [
								{
									year: "asc",
								},
								{
									semester: "asc",
								},
							],
						},
					},
				});

			/*
			 * Important:
			 *
			 * Payment callback, execute API, and reconciliation
			 * can potentially reach this code more than once.
			 *
			 * Therefore student creation is idempotent.
			 */
			if (existingStudent) {
				return existingStudent;
			}

			// -------------------------------------------------
			// 5. Generate student ID
			// -------------------------------------------------

			const prefix =
				`${admission.admissionYear}${admission.program.department.code}`;

			const existingStudents =
				await tx.student.findMany({
					where: {
						admissionYear:
							admission.admissionYear,

						program: {
							departmentId:
								admission.program.departmentId,
						},
					},

					select: {
						studentId: true,
					},
				});

			let maxSequence = 0;

			for (const student of existingStudents) {
				if (
					!student.studentId.startsWith(
						prefix,
					)
				) {
					continue;
				}

				const sequence = Number(
					student.studentId.slice(
						prefix.length,
					),
				);

				if (
					Number.isInteger(sequence) &&
					sequence > maxSequence
				) {
					maxSequence = sequence;
				}
			}

			const nextSequence = maxSequence + 1;

			if (nextSequence > 999) {
				throw new AppError(
					409,
					`Student ID sequence limit reached for ${admission.admissionYear} and department ${admission.program.department.code}.`,
				);
			}

			const studentId =
				`${prefix}${String(nextSequence).padStart(3, "0")}`;

			// -------------------------------------------------
			// 6. Create Student + first semester together
			// -------------------------------------------------

			const student = await tx.student.create({
				data: {
					/*
					 * Student.id is the same as User.id.
					 */
					id: admission.userId,

					studentId,

					admissionYear:
						admission.admissionYear,

					programId:
						admission.programId,

					currentYear: 1,

					currentSemester: 1,

					isActive: true,

					programStatus:
						StudentProgramStatus.ACTIVE,

					semesters: {
						create: {
							year: 1,
							semester: 1,
							status:
								StudentSemesterStatus.PENDING,
						},
					},
				},

				include: {
					program: {
						include: {
							department: true,
						},
					},

					semesters: {
						orderBy: [
							{
								year: "asc",
							},
							{
								semester: "asc",
							},
						],
					},
				},
			});

			return student;
		},

		{
			isolationLevel:
				Prisma.TransactionIsolationLevel.Serializable,
		},
	);
};

// =========================================================
// CREATE STUDENT FROM CONFIRMED ADMISSION
// =========================================================

export const createStudentFromConfirmedAdmission = async ({
	admissionId,
}: CreateStudentFromAdmissionParams) => {
	for (
		let attempt = 1;
		attempt <= MAX_RETRIES;
		attempt++
	) {
		try {
			return await createStudentTransaction(
				admissionId,
			);
		} catch (error) {
			/*
			 * P2034:
			 *
			 * Transaction failed because of a
			 * serialization conflict or deadlock.
			 *
			 * Retry because another student may have
			 * been generating an ID at the same time.
			 */

			const isSerializationError =
				error instanceof
					Prisma.PrismaClientKnownRequestError &&
				error.code === "P2034";

			if (
				isSerializationError &&
				attempt < MAX_RETRIES
			) {
				continue;
			}

			throw error;
		}
	}

	throw new AppError(
		409,
		"Unable to create student because of concurrent requests. Please try again.",
	);
};

// =========================================================
// GET MY STUDENT PROFILE
// =========================================================

export const getMyStudentProfile = async (
	userId: string,
) => {
	const student = await prisma.student.findUnique({
		where: {
			id: userId,
		},

		include: {
			program: {
				include: {
					department: true,
				},
			},

			semesters: {
				orderBy: [
					{
						year: "asc",
					},
					{
						semester: "asc",
					},
				],
			},
		},
	});

	if (!student) {
		throw new AppError(
			404,
			"Student profile not found.",
		);
	}

	return student;
};

// =========================================================
// GET SINGLE STUDENT
// =========================================================

export const getStudent = async ({
	studentId,
}: GetStudentParams) => {
	const student = await prisma.student.findUnique({
		where: {
			studentId,
		},

		include: {
			program: {
				include: {
					department: true,
				},
			},

			semesters: {
				orderBy: [
					{
						year: "asc",
					},
					{
						semester: "asc",
					},
				],
			},
		},
	});

	if (!student) {
		throw new AppError(
			404,
			"Student not found.",
		);
	}

	return student;
};

// =========================================================
// GET STUDENTS
// =========================================================

export const getStudents = async (
	query: GetStudentsQuery,
) => {
	const where: Prisma.StudentWhereInput = {};

	if (query.programId) {
		where.programId = query.programId;
	}

	if (query.departmentId) {
		where.program = {
			departmentId: query.departmentId,
		};
	}

	if (query.admissionYear !== undefined) {
		where.admissionYear =
			query.admissionYear;
	}

	if (query.currentYear !== undefined) {
		where.currentYear =
			query.currentYear;
	}

	if (query.currentSemester !== undefined) {
		where.currentSemester =
			query.currentSemester;
	}

	if (query.isActive !== undefined) {
		where.isActive = query.isActive;
	}

	return prisma.student.findMany({
		where,

		include: {
			program: {
				include: {
					department: true,
				},
			},
		},

		orderBy: {
			studentId: "asc",
		},
	});
};