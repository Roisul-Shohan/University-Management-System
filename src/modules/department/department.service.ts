import { prisma } from "../../lib/prisma.js";
import AppError from "../../errors/AppErrors.js";
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "./department.interface.js";

export const createDepartment = async (
  payload: CreateDepartmentInput
) => {
  const existingDepartment = await prisma.department.findFirst({
    where: {
      OR: [
        { name: payload.name },
        { code: payload.code },
      ],
    },
  });

  if (existingDepartment) {
    if (existingDepartment.name === payload.name) {
      throw new AppError(
        409,
        "A department with this name already exists."
      );
    }

    throw new AppError(
      409,
      "A department with this code already exists."
    );
  }

  return prisma.department.create({
    data: {
      name: payload.name,
      code: payload.code,
    },
  });
};

export const getAllDepartments = async () => {
  return prisma.department.findMany({
    orderBy: {
      name: "asc",
    },
  });
};

export const getDepartmentById = async (id: string) => {
  const department = await prisma.department.findUnique({
    where: {
      id,
    },
  });

  if (!department) {
    throw new AppError(404, "Department not found.");
  }

  return department;
};

export const updateDepartment = async (
  id: string,
  payload: UpdateDepartmentInput
) => {
  const department = await prisma.department.findUnique({
    where: {
      id,
    },
  });

  if (!department) {
    throw new AppError(404, "Department not found.");
  }

  if (Object.keys(payload).length === 0) {
    throw new AppError(
      400,
      "At least one field is required to update the department."
    );
  }

  if (payload.name && payload.name !== department.name) {
    const existingDepartment = await prisma.department.findUnique({
      where: {
        name: payload.name,
      },
    });

    if (existingDepartment) {
      throw new AppError(
        409,
        "A department with this name already exists."
      );
    }
  }

  if (payload.code && payload.code !== department.code) {
    const existingDepartment = await prisma.department.findUnique({
      where: {
        code: payload.code,
      },
    });

    if (existingDepartment) {
      throw new AppError(
        409,
        "A department with this code already exists."
      );
    }
  }

  return prisma.department.update({
    where: {
      id,
    },
    data: payload,
  });
};

export const deleteDepartment = async (id: string) => {
  const department = await prisma.department.findUnique({
    where: {
      id,
    },
    include: {
      teachers: {
        select: {
          id: true,
        },
        take: 1,
      },
      programs: {
        select: {
          id: true,
        },
        take: 1,
      },
      courses: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!department) {
    throw new AppError(404, "Department not found.");
  }

  if (department.teachers.length > 0) {
    throw new AppError(
      409,
      "Cannot delete department because it has teachers."
    );
  }

  if (department.programs.length > 0) {
    throw new AppError(
      409,
      "Cannot delete department because it has programs."
    );
  }

  if (department.courses.length > 0) {
    throw new AppError(
      409,
      "Cannot delete department because it has courses."
    );
  }

  await prisma.department.delete({
    where: {
      id,
    },
  });
};