import { Request, Response } from 'express';
import { JwtPayload } from '../utils/jwt';
import * as teamService from '../services/team.service';
import * as hackathonService from '../services/hackathon.service';
import * as registrationService from '../services/registration.service';
import { z } from 'zod';

const createTeamSchema = z.object({
  teamName: z.string().min(1, 'Team name is required').max(50),
});

const joinTeamSchema = z.object({
  joinCode: z.string().length(6, 'Join code must be 6 characters'),
});

// POST /api/hackathons/:hackathonId/teams — create a team
export const createTeam = async (req: Request, res: Response) => {
  try {
    const hackathonId = req.params.hackathonId as string;
    const parsed = createTeamSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const user = req.user as unknown as JwtPayload;

    // 1. Check hackathon exists
    const hackathon = await hackathonService.getHackathonPublic(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    // 2. Check deadline hasn't passed
    if (new Date() > new Date(hackathon.regDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed',
      });
    }

    // 3. Check user is registered for this hackathon
    const registration = await registrationService.getHackathonRegistration(
      user.userId,
      hackathonId
    );
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'You must register for the hackathon before creating a team',
      });
    }

    // 4. Check user not already in a team
    const existingTeam = await teamService.getUserTeamInHackathon(user.userId, hackathonId);
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a team for this hackathon',
      });
    }

    const team = await teamService.createTeam({
      hackathonId,
      teamName: parsed.data.teamName,
      userId: user.userId,
    });

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ success: false, message: 'Failed to create team' });
  }
};

// POST /api/hackathons/:hackathonId/teams/join — join a team by code
export const joinTeam = async (req: Request, res: Response) => {
  try {
    const hackathonId = req.params.hackathonId as string;
    const parsed = joinTeamSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const user = req.user as unknown as JwtPayload;

    // 1. Check hackathon exists
    const hackathon = await hackathonService.getHackathonPublic(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    // 2. Check deadline hasn't passed
    if (new Date() > new Date(hackathon.regDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed',
      });
    }

    // 3. Check user is registered
    const registration = await registrationService.getHackathonRegistration(
      user.userId,
      hackathonId
    );
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'You must register for the hackathon before joining a team',
      });
    }

    // 4. Check user not already in a team
    const existingTeam = await teamService.getUserTeamInHackathon(user.userId, hackathonId);
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a team for this hackathon',
      });
    }

    // 5. Find team by join code
    const team = await teamService.getTeamByJoinCode(parsed.data.joinCode);
    if (!team || team.hackathonId !== hackathonId) {
      return res.status(404).json({ success: false, message: 'Invalid join code' });
    }

    // 6. Check team isn't full
    if (team.members.length >= hackathon.maxTeamSize) {
      return res.status(400).json({ success: false, message: 'Team is already full' });
    }

    await teamService.addTeamMember({
      teamId: team.id,
      userId: user.userId,
      hackathonId,
    });

    res.json({ success: true, message: 'Joined team successfully', data: { teamId: team.id } });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ success: false, message: 'Failed to join team' });
  }
};