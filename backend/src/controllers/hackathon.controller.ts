import { Request, Response } from 'express';
import { JwtPayload } from '../utils/jwt';
import * as hackathonService from '../services/hackathon.service';
import * as registrationService from '../services/registration.service';
import { z } from 'zod';
import { invalidateCalendarCache } from '../services/calendar.service';
const createHackathonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  problemStatement: z.string().min(1, 'Problem statement is required'),
  rules: z.string().optional(),
  prizes: z.string().optional(),
  regDeadline: z.string().datetime('Invalid registration deadline'),
  submissionDeadline: z.string().datetime('Invalid submission deadline'),
  maxTeamSize: z.number().int().min(1).max(10),
  minTeamSize: z.number().int().min(1),
  tags: z.array(z.string()).default([]),
});

const updateHackathonSchema = createHackathonSchema.partial();

// GET /api/hackathons
export const getAllHackathons = async (_req: Request, res: Response) => {
  try {
    const hackathons = await hackathonService.getAllHackathons();
    res.json({ success: true, data: hackathons });
  } catch (error) {
    console.error('Get all hackathons error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch hackathons' });
  }
};

// GET /api/hackathons/:id
// returns different data based on role
export const getHackathonById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user as unknown as JwtPayload | undefined;

    let hackathon;

    if (!user) {
      // not logged in — public data only
      hackathon = await hackathonService.getHackathonPublic(id);
    } else if (user.role === 'ADMIN' || user.role === 'SENIOR') {
      // senior or admin — full data
      hackathon = await hackathonService.getHackathonForAdmin(id);
    } else {
      // regular member — their team only
      hackathon = await hackathonService.getHackathonForMember(id, user.userId);
    }

    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    let isRegistered = false;
    if (user) {
      const reg = await registrationService.getHackathonRegistration(user.userId, id);
      isRegistered = !!reg;
    }

    res.json({
      success: true,
      data: {
        ...hackathon,
        isRegistered,
      },
    });
  } catch (error) {
    console.error('Get hackathon error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch hackathon' });
  }
};

// GET /api/hackathons/:id/registrations — admin only
export const getHackathonRegistrations = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const hackathon = await hackathonService.getHackathonForAdmin(id, true);

    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    res.json({ success: true, data: hackathon.registrations });
  } catch (error) {
    console.error('Get hackathon registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
  }
};

// POST /api/hackathons — admin only
export const createHackathon = async (req: Request, res: Response) => {
  try {
    const parsed = createHackathonSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    // validate deadlines
    if (new Date(parsed.data.submissionDeadline) <= new Date(parsed.data.regDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Submission deadline must be after registration deadline',
      });
    }

    // validate team size
    if (parsed.data.minTeamSize > parsed.data.maxTeamSize) {
      return res.status(400).json({
        success: false,
        message: 'Minimum team size cannot be greater than maximum team size',
      });
    }

    const user = req.user as unknown as JwtPayload;

    const hackathon = await hackathonService.createHackathon({
      ...parsed.data,
      regDeadline: new Date(parsed.data.regDeadline),
      submissionDeadline: new Date(parsed.data.submissionDeadline),
      createdBy: user.userId,
    });
    await invalidateCalendarCache();
    res.status(201).json({ success: true, data: hackathon });
  } catch (error) {
    console.error('Create hackathon error:', error);
    res.status(500).json({ success: false, message: 'Failed to create hackathon' });
  }
};

// PATCH /api/hackathons/:id — admin only
export const updateHackathon = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = updateHackathonSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await hackathonService.getHackathonPublic(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    const updated = await hackathonService.updateHackathon(id, {
      ...parsed.data,
      regDeadline: parsed.data.regDeadline ? new Date(parsed.data.regDeadline) : undefined,
      submissionDeadline: parsed.data.submissionDeadline
        ? new Date(parsed.data.submissionDeadline)
        : undefined,
    });
    await invalidateCalendarCache();
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update hackathon error:', error);
    res.status(500).json({ success: false, message: 'Failed to update hackathon' });
  }
};

// DELETE /api/hackathons/:id — admin only
export const deleteHackathon = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await hackathonService.getHackathonPublic(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    await hackathonService.deleteHackathon(id);
    await invalidateCalendarCache();
    res.json({ success: true, message: 'Hackathon deleted successfully' });
  } catch (error) {
    console.error('Delete hackathon error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete hackathon' });
  }
};