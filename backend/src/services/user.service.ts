import prisma from '../config/db';

//Get a user's own profile
export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      year: true,
      bio: true,
      phone: true,
      hackerrankUsername: true,
      isProfileComplete: true,
      createdAt: true,
    },
  });
};

//Complete or update profile 
export const updateProfile = async (id: string, data: Partial<{
  phone: string;
  hackerrankUsername: string;
  bio: string;
  avatarUrl: string;
  isProfileComplete: boolean;
}>) => {
  return await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      year: true,
      bio: true,
      phone: true,
      hackerrankUsername: true,
      isProfileComplete: true,
    },
  });
};

//Admin - change a user's role
export const updateUserRole = async (id: string, role: string) => {
  return await prisma.user.update({
    where: { id },
    data: { role: role as any },
    select: { id: true, name: true, email: true, role: true },
  });
};

//Admin - list all users
export const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      year: true,
      avatarUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Refresh a user's year from their email
export const refreshUserYear = async (id: string, computedYear: number) => {
  return await prisma.user.update({
    where: { id },
    data: { year: computedYear },
    select: { id: true, year: true },
  });
};