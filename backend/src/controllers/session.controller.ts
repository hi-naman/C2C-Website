import { Request, Response } from 'express';
import { JwtPayload } from '../utils/jwt';
import * as sessionService from '../services/session.service';
import { z } from 'zod';
import { invalidateCalendarCache } from '../services/calendar.service';
// Zod schema for creating a session
const createSessionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  speakerName: z.string().min(1, 'Speaker name is required'),
  speakerBio: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  date: z.string().datetime('Invalid date format'),
  venue: z.string().min(1, 'Venue is required'),
  slidesUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  yearTarget: z.enum(['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'ALL']).default('ALL'),
});

// Zod schema for updating a session
const updateSessionSchema = createSessionSchema.partial();

// GET /api/sessions
export const getAllSessions = async (req: Request, res: Response) => {
  try {
    // Extract first value only if it's an array
    const yearTarget = (Array.isArray(req.query.yearTarget) 
      ? req.query.yearTarget[0] 
      : req.query.yearTarget )as string | undefined;

    const sessions = await sessionService.getAllSessions(yearTarget);
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
};

// GET /api/sessions/:id
export const getSessionById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const session = await sessionService.getSessionById(id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch session' });
  }
};

// PATCH /api/sessions/:id
export const updateSession = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = updateSessionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors 
      });
    }

    const existing = await sessionService.getSessionById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const user = req.user as unknown as JwtPayload;

    if (user.role === 'SENIOR' && existing.createdBy !== user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only edit your own sessions' 
      });
    }

    const updated = await sessionService.updateSession(id, {
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : undefined,
    });
    //invalidated the calendar cache as event changed
    await invalidateCalendarCache();
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update session' });
  }
};

// DELETE /api/sessions/:id
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await sessionService.getSessionById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const user = req.user as unknown as JwtPayload;

    if (user.role === 'SENIOR' && existing.createdBy !== user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own sessions' 
      });
    }

    await sessionService.deleteSession(id);
    await invalidateCalendarCache();
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete session' });
  }
};

// POST /api/sessions
export const createSession = async (req: Request, res: Response) => {
  try {
    const parsed = createSessionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors 
      });
    }

    const user = req.user as unknown as JwtPayload;

    const session = await sessionService.createSession({
      ...parsed.data,
      date: new Date(parsed.data.date),
      createdBy: user.userId,
    });
    await invalidateCalendarCache();
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create session' });
  }
};