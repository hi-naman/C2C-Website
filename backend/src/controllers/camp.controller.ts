import { Request, Response } from 'express';
import { JwtPayload } from '../utils/jwt';
import * as campService from '../services/camp.service';
import { z } from 'zod';
import { invalidateCalendarCache } from '../services/calendar.service';

const yearTargetSchema = z.preprocess((val) => {
  if (typeof val === 'string') return [val];
  if (Array.isArray(val)) return val;
  return ['ALL'];
}, z.array(z.enum(['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'ALL'])).min(1, 'At least one target year is required'));

const createCampSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['WINTER', 'SUMMER']),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  venue: z.string().optional(),
  maxSeats: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  yearTarget: yearTargetSchema.default(['ALL']),
});

const updateCampSchema = createCampSchema.partial();

// GET /api/camps
export const getAllCamps = async (req: Request, res: Response) => {
  try {
    const yearTarget = (
      Array.isArray(req.query.yearTarget)
        ? req.query.yearTarget[0]
        : req.query.yearTarget
    ) as string | undefined;

    const camps = await campService.getAllCamps(yearTarget);
    res.json({ success: true, data: camps });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch camps' });
  }
};

// GET /api/camps/:id
export const getCampById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const camp = await campService.getCampById(id);

    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    res.json({ success: true, data: camp });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch camp' });
  }
};

// GET /api/camps/:id/registrations — admin only
export const getCampRegistrations = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const camp = await campService.getCampById(id, true);
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    res.json({ success: true, data: camp.registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
  }
};

// POST /api/camps — admin only
export const createCamp = async (req: Request, res: Response) => {
  try {
    const parsed = createCampSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    if (new Date(parsed.data.endDate) <= new Date(parsed.data.startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    const user = req.user as unknown as JwtPayload;

    const camp = await campService.createCamp({
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      createdBy: user.userId,
    });
    await invalidateCalendarCache();
    res.status(201).json({ success: true, data: camp });
  } catch (error) {
    console.error('Create camp error:', error);
    res.status(500).json({ success: false, message: 'Failed to create camp' });
  }
};

// PATCH /api/camps/:id — admin only
export const updateCamp = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = updateCampSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await campService.getCampById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    const updated = await campService.updateCamp(id, {
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    });
    await invalidateCalendarCache();
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update camp' });
  }
};

// DELETE /api/camps/:id — admin only
export const deleteCamp = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await campService.getCampById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    await campService.deleteCamp(id);
    await invalidateCalendarCache();
    res.json({ success: true, message: 'Camp deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete camp' });
  }
};