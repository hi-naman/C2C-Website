import prisma from '../config/db';

// Register for a camp
export const registerForCamp = async (userId: string, campId: string) => {
  return await prisma.registration.create({
    data: {
      userId,
      campId,
      eventType: 'CAMP',
    },
  });
};

// Register for a hackathon
export const registerForHackathon = async (userId: string, hackathonId: string) => {
  return await prisma.registration.create({
    data: {
      userId,
      hackathonId,
      eventType: 'HACKATHON',
    },
  });
};

// Check if user is registered for a camp
export const getCampRegistration = async (userId: string, campId: string) => {
  return await prisma.registration.findUnique({
    where: {
      userId_campId: { userId, campId },
    },
  });
};

// Check if user is registered for a hackathon
export const getHackathonRegistration = async (userId: string, hackathonId: string) => {
  return await prisma.registration.findUnique({
    where: {
      userId_hackathonId: { userId, hackathonId },
    },
  });
};

// Count registrations for a camp (for seat checking)
export const getCampRegistrationCount = async (campId: string) => {
  return await prisma.registration.count({
    where: { campId },
  });
};

// Get all of a user's registrations
export const getMyRegistrations = async (userId: string) => {
  return await prisma.registration.findMany({
    where: { userId },
    include: {
      camp: {
        select: { id: true, title: true, startDate: true, endDate: true, type: true },
      },
      hackathon: {
        select: { id: true, title: true, regDeadline: true, submissionDeadline: true },
      },
    },
    orderBy: { registeredAt: 'desc' },
  });
};