import { Request, Response } from 'express';
import * as leaderboardService from '../services/leaderboard.service';

// GET /api/leaderboard?year=1
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const yearRaw = (
      Array.isArray(req.query.year) ? req.query.year[0] : req.query.year
    ) as string | undefined;

    if (!yearRaw) {
      return res.status(400).json({
        success: false,
        message: 'Year is required (1, 2, 3, or 4)',
      });
    }

    const year = parseInt(yearRaw, 10);
    if (isNaN(year) || year < 1 || year > 4) {
      return res.status(400).json({
        success: false,
        message: 'Year must be 1, 2, 3, or 4',
      });
    }

    const leaderboard = await leaderboardService.getLeaderboard(year);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
};