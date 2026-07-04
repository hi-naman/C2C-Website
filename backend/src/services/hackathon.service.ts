import prisma from '../config/db';

export const getAllHackathons = async () => {
  return await prisma.hackathon.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      tags: true,
      regDeadline: true,
      submissionDeadline: true,
      prizes: true,
      maxTeamSize: true,
      minTeamSize: true,
      createdAt: true,
      _count: {
        select: { teams: true, registrations: true },
      },
    },
    orderBy: { regDeadline: 'desc' },
  });
};

// For public / unauthenticated users
export const getHackathonPublic = async (id: string) => {
  return await prisma.hackathon.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      prizes: true,
      tags: true,
      regDeadline: true,
      submissionDeadline: true,
      maxTeamSize: true,
      minTeamSize: true,
      createdAt: true,
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });
};

// For logged in members — shows their own team only
export const getHackathonForMember = async (id: string, userId: string) => {
  return await prisma.hackathon.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      problemStatement: true,
      rules: true,
      prizes: true,
      tags: true,
      regDeadline: true,
      submissionDeadline: true,
      maxTeamSize: true,
      minTeamSize: true,
      createdAt: true,
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
      teams: {
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          },
        },
      },
    },
  });
};

// For seniors and admins — full data
export const getHackathonForAdmin = async (id: string, includeRegistrations = false) => {
  return await prisma.hackathon.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
      teams: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true, email: true, year: true, phone: true },
              },
            },
          },
        },
      },
      registrations: includeRegistrations
        ? {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                  year: true,
                  phone: true,
                },
              },
            },
            orderBy: { registeredAt: 'desc' },
          }
        : false,
    },
  });
};

export const createHackathon = async (data: {
  title: string;
  description: string;
  problemStatement: string;
  rules?: string;
  prizes?: string;
  regDeadline: Date;
  submissionDeadline: Date;
  maxTeamSize: number;
  minTeamSize: number;
  tags: string[];
  createdBy: string;
}) => {
  return await prisma.hackathon.create({ data });
};

export const updateHackathon = async (
  id: string,
  data: Partial<{
    title: string;
    description: string;
    problemStatement: string;
    rules: string;
    prizes: string;
    regDeadline: Date;
    submissionDeadline: Date;
    maxTeamSize: number;
    minTeamSize: number;
    tags: string[];
  }>
) => {
  return await prisma.hackathon.update({ where: { id }, data });
};

export const deleteHackathon = async (id: string) => {
  return await prisma.hackathon.delete({ where: { id } });
};