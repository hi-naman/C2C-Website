import { Request, Response } from 'express';
import { JwtPayload } from '../utils/jwt';
import * as contestService from '../services/contest.service';
import { z } from 'zod';
import { invalidateCalendarCache } from '../services/calendar.service';
const createContestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  hackerrankUrl: z.string().url('Invalid HackerRank URL'),
  accessCode: z.string().optional(),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  yearTarget: z.enum(['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'ALL']).default('ALL'),
});

const unlockSchema = z.object({
  code: z.string().min(1, 'Access code is required'),
});

export const unlockContest = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = unlockSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Access code is required' });
    }

    const contest = await contestService.getContestRaw(id);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    // reuse the shared logic — ended or no code means link is open
    if (contestService.shouldRevealLink(contest)) {
      return res.json({ success: true, data: { hackerrankUrl: contest.hackerrankUrl } });
    }

    // otherwise it's gated — check the code
    if (parsed.data.code !== contest.accessCode) {
      return res.status(403).json({ success: false, message: 'Incorrect access code' });
    }

    res.json({ success: true, data: { hackerrankUrl: contest.hackerrankUrl } });
  } catch (error) {
    console.error('Unlock contest error:', error);
    res.status(500).json({ success: false, message: 'Failed to unlock contest' });
  }
};

const updateContestSchema = createContestSchema.partial();

// GET /api/contests
export const getAllContests = async (req: Request, res: Response) => {
  try {
    const yearTarget = (
      Array.isArray(req.query.yearTarget)
        ? req.query.yearTarget[0]
        : req.query.yearTarget
    ) as string | undefined;

    const contests = await contestService.getAllContests(yearTarget);
    res.json({ success: true, data: contests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch contests' });
  }
};

// GET /api/contests/:id
export const getContestById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const contest = await contestService.getContestById(id);

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    res.json({ success: true, data: contest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch contest' });
  }
};

// POST /api/contests
export const createContest = async (req: Request, res: Response) => {
  try {
    const parsed = createContestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    // Validate that endTime is after startTime
    if (new Date(parsed.data.endTime) <= new Date(parsed.data.startTime)) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    const user = req.user as unknown as JwtPayload;

    const contest = await contestService.createContest({
      ...parsed.data,
      startTime: new Date(parsed.data.startTime),
      endTime: new Date(parsed.data.endTime),
      createdBy: user.userId,
    });
    await invalidateCalendarCache();
    res.status(201).json({ success: true, data: contest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create contest' });
  }
};

// PATCH /api/contests/:id
export const updateContest = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = updateContestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await contestService.getContestById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    const user = req.user as unknown as JwtPayload;

    // Seniors can only edit their own contests
    if (user.role === 'SENIOR' && existing.createdBy !== user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own contests',
      });
    }

    const updated = await contestService.updateContest(id, {
      ...parsed.data,
      startTime: parsed.data.startTime ? new Date(parsed.data.startTime) : undefined,
      endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : undefined,
    });
    await invalidateCalendarCache();
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update contest' });
  }
};

// DELETE /api/contests/:id
export const deleteContest = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await contestService.getContestById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    const user = req.user as unknown as JwtPayload;

    // Seniors can only delete their own contests
    if (user.role === 'SENIOR' && existing.createdBy !== user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own contests',
      });
    }

    await contestService.deleteContest(id);
    await invalidateCalendarCache();
    res.json({ success: true, message: 'Contest deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete contest' });
  }
};