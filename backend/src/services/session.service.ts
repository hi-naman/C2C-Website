import prisma from '../config/db';

// Get all sessions — with optional year filter
export const getAllSessions = async (yearTarget?: string) => {
  return await prisma.session.findMany({
    where: yearTarget ? { yearTarget: yearTarget as any } : {},
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });
};

// Get a single session by ID
export const getSessionById = async (id: string) => {
  return await prisma.session.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });
};

// Create a new session
export const createSession = async (data: {
  title: string;
  speakerName: string;
  speakerBio?: string;
  description: string;
  date: Date;
  venue: string;
  slidesUrl?: string;
  tags: string[];
  yearTarget: string;
  createdBy: string;
}) => {
  return await prisma.session.create({
    data: {
      ...data,
      yearTarget: data.yearTarget as any,
    },
  });
};

// Update a session
export const updateSession = async (id: string, data: Partial<{
  title: string;
  speakerName: string;
  speakerBio: string;
  description: string;
  date: Date;
  venue: string;
  slidesUrl: string;
  tags: string[];
  yearTarget: string;
}>) => {
  return await prisma.session.update({
    where: { id },
    data: {
      ...data,
      yearTarget: data.yearTarget as any,
    },
  });
};

// Delete a session
export const deleteSession = async (id: string) => {
  return await prisma.session.delete({
    where: { id },
  });
};