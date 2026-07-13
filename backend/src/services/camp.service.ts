import prisma from '../config/db';

export const getAllCamps = async (yearTarget?: string) => {
  const where = yearTarget ? { yearTarget } : {};
  
  return await prisma.camp.findMany({
    where: where as any,
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: { startDate: 'desc' },
  });
};

export const getCampById = async (id: string, includeRegistrations = false) => {
  return await prisma.camp.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
      _count: {
        select: { registrations: true },
      },
      registrations: includeRegistrations
        ? {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true, year: true, phone: true },
              },
            },
            orderBy: { registeredAt: 'desc' },
          }
        : false,
    },
  });
};

export const createCamp = async (data: {
  title: string;
  description: string;
  type: string;
  startDate: Date;
  endDate: Date;
  venue?: string;
  maxSeats?: number;
  tags: string[];
  yearTarget: string;
  createdBy: string;
}) => {
  return await prisma.camp.create({
    data: {
      ...data,
      type: data.type as any,
      yearTarget: data.yearTarget as any,
    },
  });
};

export const updateCamp = async (id: string, data: Partial<{
  title: string;
  description: string;
  type: string;
  startDate: Date;
  endDate: Date;
  venue: string;
  maxSeats: number;
  tags: string[];
  yearTarget: string;
}>) => {
  return await prisma.camp.update({
    where: { id },
    data: {
      ...data,
      type: data.type as any,
      yearTarget: data.yearTarget as any,
    },
  });
};

export const deleteCamp = async (id: string) => {
  return await prisma.camp.delete({ where: { id } });
};
