import { DegreeType, Role } from "../../generated/prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import config from "../config";
import AppError from "../errors/AppErrors";
import { Program } from "../../generated/prisma/browser";

export async function seedSuperAdmin() {
	const email = config.super_admin_email;
	const password = config.super_admin_password;

	if (!email || !password) {
		throw new AppError(
			500,
			"SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be defined.",
		);
	}

	const existingAdmin = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (existingAdmin) {
		console.log("Super Admin already exists. Skipping...");
		return;
	}

	const hashed_password = await bcrypt.hash(password, 12);

	await prisma.user.create({
		data: {
			email,
			password: hashed_password,
			name: "Super Admin",
			role: Role.SUPER_ADMIN,
		},
	});

	console.log("Super Admin created successfully.");
}

export async function seedDepartments() {
	const departments = [
		{
			name: "Computer Science and Engineering",
			code: "CSE",
		},
		{
			name: "Electrical and Electronic Engineering",
			code: "EEE",
		},
		{
			name: "Electronics and Telecommunication Engineering",
			code: "ETE",
		},
		{
			name: "Information and Communication Technology",
			code: "ICT",
		},
		{
			name: "Software Engineering",
			code: "SWE",
		},
		{
			name: "Civil Engineering",
			code: "CE",
		},
		{
			name: "Mechanical Engineering",
			code: "ME",
		},
		{
			name: "Industrial and Production Engineering",
			code: "IPE",
		},
		{
			name: "Architecture",
			code: "ARCH",
		},
		{
			name: "Textile Engineering",
			code: "TE",
		},
		{
			name: "Chemical Engineering",
			code: "CHE",
		},
		{
			name: "Biomedical Engineering",
			code: "BME",
		},
		{
			name: "Business Administration",
			code: "BBA",
		},
		{
			name: "Economics",
			code: "ECO",
		},
		{
			name: "English",
			code: "ENG",
		},
		{
			name: "Bangla",
			code: "BAN",
		},
		{
			name: "Law",
			code: "LAW",
		},
		{
			name: "Mathematics",
			code: "MAT",
		},
		{
			name: "Physics",
			code: "PHY",
		},
		{
			name: "Chemistry",
			code: "CHEM",
		},
	];

	for (const department of departments) {
		await prisma.department.upsert({
			where: {
				code: department.code,
			},
			update: {},
			create: department,
		});
	}
}

export async function seedCourses() {
	const department = await prisma.department.findUnique({
		where: {
			code: "CSE",
		},
	});

	if (!department) {
		throw new AppError(
			500,
			"CSE department not found. Create the departments before seeding courses.",
		);
	}

	const courses = [
		// Year 1 - Semester 1
		{
			code: "CSE1101",
			name: "Introduction to Programming",
			credits: 3,
		},
		{
			code: "CSE1102",
			name: "Discrete Mathematics",
			credits: 3,
		},
		{
			code: "CSE1103",
			name: "Digital Logic Design",
			credits: 3,
		},
		{
			code: "CSE1104",
			name: "Computer Fundamentals",
			credits: 3,
		},

		// Year 1 - Semester 2
		{
			code: "CSE1201",
			name: "Object Oriented Programming",
			credits: 3,
		},
		{
			code: "CSE1202",
			name: "Data Structures",
			credits: 3,
		},
		{
			code: "CSE1203",
			name: "Database Fundamentals",
			credits: 3,
		},
		{
			code: "CSE1204",
			name: "Computer Architecture",
			credits: 3,
		},

		// Year 2 - Semester 1
		{
			code: "CSE2101",
			name: "Algorithms",
			credits: 3,
		},
		{
			code: "CSE2102",
			name: "Operating Systems",
			credits: 3,
		},
		{
			code: "CSE2103",
			name: "Database Management Systems",
			credits: 3,
		},
		{
			code: "CSE2104",
			name: "Object Oriented Analysis and Design",
			credits: 3,
		},

		// Year 2 - Semester 2
		{
			code: "CSE2201",
			name: "Computer Networks",
			credits: 3,
		},
		{
			code: "CSE2202",
			name: "Software Engineering",
			credits: 3,
		},
		{
			code: "CSE2203",
			name: "Web Engineering",
			credits: 3,
		},
		{
			code: "CSE2204",
			name: "Theory of Computation",
			credits: 3,
		},

		// Year 3 - Semester 1
		{
			code: "CSE3101",
			name: "Artificial Intelligence",
			credits: 3,
		},
		{
			code: "CSE3102",
			name: "Machine Learning",
			credits: 3,
		},
		{
			code: "CSE3103",
			name: "Compiler Design",
			credits: 3,
		},
		{
			code: "CSE3104",
			name: "Distributed Systems",
			credits: 3,
		},

		// Year 3 - Semester 2
		{
			code: "CSE3201",
			name: "Computer Graphics",
			credits: 3,
		},
		{
			code: "CSE3202",
			name: "Information Security",
			credits: 3,
		},
		{
			code: "CSE3203",
			name: "Cloud Computing",
			credits: 3,
		},
		{
			code: "CSE3204",
			name: "Mobile Application Development",
			credits: 3,
		},

		// Year 4 - Semester 1
		{
			code: "CSE4101",
			name: "Software Architecture",
			credits: 3,
		},
		{
			code: "CSE4102",
			name: "Advanced Database Systems",
			credits: 3,
		},
		{
			code: "CSE4103",
			name: "Advanced Web Development",
			credits: 3,
		},
		{
			code: "CSE4104",
			name: "DevOps and Continuous Integration",
			credits: 3,
		},

		// Year 4 - Semester 2
		{
			code: "CSE4201",
			name: "Natural Language Processing",
			credits: 3,
		},
		{
			code: "CSE4202",
			name: "Big Data Analytics",
			credits: 3,
		},
		{
			code: "CSE4203",
			name: "Cyber Security",
			credits: 3,
		},
		{
			code: "CSE4204",
			name: "Final Year Project",
			credits: 3,
		},
	];

	for (const course of courses) {
		await prisma.course.upsert({
			where: {
				code: course.code,
			},
			update: {},
			create: {
				...course,
				departmentId: department.id,
			},
		});
	}
}

export async function seedPrograms() {
	const departments = await prisma.department.findMany();

	if (departments.length === 0) {
		throw new AppError(
			500,
			"No departments found. Create departments before seeding programs.",
		);
	}

	const programs = [
		{
			degreeType: DegreeType.BSC,
			fee: 10000,
		},
		{
			degreeType: DegreeType.MSC,
			fee: 15000,
		},
		{
			degreeType: DegreeType.PHD,
			fee: 25000,
		},
	];

	for (const department of departments) {
		for (const program of programs) {
			const programRecord = await prisma.program.upsert({
				where: {
					departmentId_degreeType: {
						departmentId: department.id,
						degreeType: program.degreeType,
					},
				},

				update: {},

				create: {
					departmentId: department.id,
					degreeType: program.degreeType,
				},
			});

			const existingFee = await prisma.admissionFee.findFirst({
				where: {
					programId: programRecord.id,
					isActive: true,
				},
			});

			if (!existingFee) {
				await prisma.admissionFee.create({
					data: {
						programId: programRecord.id,
						amount: program.fee,
						isActive: true,
					},
				});
			}
		}
	}

	console.log("Programs and admission fees seeded successfully.");
}

export async function seed() {
	await seedSuperAdmin();
	await seedDepartments();
	await seedCourses();
	await seedPrograms();

	console.log("Database seeding completed.");
}
