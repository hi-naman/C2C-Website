import { Request, Response } from 'express';
import * as calendarService from '../services/calendar.service';

// GET /api/calendar?year=2 
export const getCalendar = async (req: Request, res: Response) => {
  try {
    const yearRaw = (
      Array.isArray(req.query.year) ? req.query.year[0] : req.query.year
    ) as string | undefined;

    let year: number | undefined;
    if (yearRaw) {
      year = parseInt(yearRaw, 10);
      if (isNaN(year) || year < 1 || year > 4) {
        return res.status(400).json({
          success: false,
          message: 'Year must be 1, 2, 3, or 4',
        });
      }
    }

    const events = await calendarService.getCalendar(year);
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch calendar' });
  }
};