import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as leaderboardController from '../controllers/leaderboard.controller';

const router = Router();

/**
 * @openapi
 * /api/leaderboard:
 *   get:
 *     summary: Get the year-wise leaderboard (login required)
 *     tags: [Leaderboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema: { type: integer, enum: [1, 2, 3, 4] }
 *         description: Which year's leaderboard to fetch
 *     responses:
 *       200: { description: Ranked leaderboard for the year }
 *       400: { description: Year is required (1-4) }
 */
router.get('/', authenticate, leaderboardController.getLeaderboard);

export default router;