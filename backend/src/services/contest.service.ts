import prisma from '../config/db';

export const shouldRevealLink = (contest: {
  accessCode: string | null;
  endTime: Date;
  hackerrankUrl: string;
}): boolean => {
  if (!contest.accessCode) return true;        // open contest
  if (new Date() > new Date(contest.endTime)) return true; // ended
  return false;                                 // gated
};

const applyLinkVisibility = (contest: any) => {
  if (!shouldRevealLink(contest)) {
    return { ...contest, hackerrankUrl: null, isLocked: true };
  }
  return { ...contest, isLocked: false };
};

export const getAllContests = async (yearTarget?: string) => {
  const contests = await prisma.contest.findMany({
    where: yearTarget ? { yearTarget: yearTarget as any } : undefined,
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { startTime: 'desc' },
  });

  return contests.map(applyLinkVisibility);
};

export const getContestById = async (id: string) => {
  const contest = await prisma.contest.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  if (!contest) return null;
  return applyLinkVisibility(contest);
};

export const getContestRaw = async (id: string) => {
  return await prisma.contest.findUnique({
    where: { id },
  });
};

export const createContest = async (data: {
  title: string;
  description: string;
  hackerrankUrl: string;
  accessCode?: string;
  startTime: Date;
  endTime: Date;
  yearTarget: string;
  createdBy: string;
}) => {
  return await prisma.contest.create({
    data: {
      ...data,
      yearTarget: data.yearTarget as any,
    },
  });
};

export const updateContest = async (id: string, data: Partial<{
  title: string;
  description: string;
  hackerrankUrl: string;
  accessCode: string;
  startTime: Date;
  endTime: Date;
  yearTarget: string;
  }>) => {
  return await prisma.contest.update({
    where: { id },
    data: {
      ...data,
      yearTarget: data.yearTarget as any,
    },
  });
};

export const deleteContest = async (id: string) => {
  return await prisma.contest.delete({ where: { id } });
};