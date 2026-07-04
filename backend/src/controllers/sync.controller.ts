import { Request, Response } from 'express';
import * as leaderboardService from '../services/leaderboard.service';
import * as contestService from '../services/contest.service';
import { z } from 'zod';

// The shape of a single HackerRank leaderboard entry (from their REST JSON)
const hackerEntrySchema = z.object({
  hacker: z.string(),
  score: z.number(),
  rank: z.number(),
});

// The admin pastes the full JSON response - we expect a `models` array
const syncSchema = z.object({
  models: z.array(hackerEntrySchema),
});

// POST /api/sync/contest/:contestId - admin only
export const syncContest = async (req: Request, res: Response) => {
  try {
    const contestId = req.params.contestId as string;

    //validate the pasted JSON has the expected structure
    const parsed = syncSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leaderboard data. Paste the full JSON from the HackerRank leaderboard endpoint (must contain a "models" array).',
      });
    }

    //check contest exists
    const contest = await contestService.getContestById(contestId);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    // map HackerRank's shape into our source-agnostic shape
    const entries = parsed.data.models.map((m) => ({
      hackerrankUsername: m.hacker,
      score: m.score,
      rank: m.rank,
    }));

    // sync into DB
    const result = await leaderboardService.syncContestScores(contestId, entries);

    res.json({
      success: true,
      message: 'Leaderboard synced successfully',
      data: result,
    });
  } catch (error) {
    console.error('Sync contest error:', error);
    res.status(500).json({ success: false, message: 'Failed to sync contest' });
  }
};