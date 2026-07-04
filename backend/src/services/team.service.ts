import prisma from '../config/db';
import { generateJoinCode } from '../utils/generateCode';

// Create a team with a unique join code
export const createTeam = async (data: {
  hackathonId: string;
  teamName: string;
  userId: string;
}) => {
  // Generate a unique join code (retry if collision)
  let joinCode = generateJoinCode();
  let existing = await prisma.hackathonTeam.findUnique({ where: { joinCode } });

  while (existing) {
    joinCode = generateJoinCode();
    existing = await prisma.hackathonTeam.findUnique({ where: { joinCode } });
  }

  // Create team and add creator as first member in one transaction
  return await prisma.$transaction(async (tx) => {
    const team = await tx.hackathonTeam.create({
      data: {
        hackathonId: data.hackathonId,
        teamName: data.teamName,
        joinCode,
      },
    });

    await tx.teamMember.create({
      data: {
        teamId: team.id,
        userId: data.userId,
        hackathonId: data.hackathonId,
      },
    });

    return team;
  });
};

// Find a team by its join code
export const getTeamByJoinCode = async (joinCode: string) => {
  return await prisma.hackathonTeam.findUnique({
    where: { joinCode },
    include: {
      members: true,
    },
  });
};

// Add a member to a team
export const addTeamMember = async (data: {
  teamId: string;
  userId: string;
  hackathonId: string;
}) => {
  return await prisma.teamMember.create({ data });
};

// Check if user is already in a team for this hackathon
export const getUserTeamInHackathon = async (userId: string, hackathonId: string) => {
  return await prisma.teamMember.findUnique({
    where: {
      userId_hackathonId: { userId, hackathonId },
    },
  });
};