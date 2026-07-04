import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as syncController from '../controllers/sync.controller';

const router = Router();

/**
 * @openapi
 * /api/sync/contest/{contestId}:
 *   post:
 *     summary: Sync leaderboard from pasted HackerRank JSON (admin only)
 *     tags: [Sync]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: contestId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [models]
 *             properties:
 *               models:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     hacker: { type: string }
 *                     score: { type: number }
 *                     rank: { type: integer }
 *     responses:
 *       200: { description: "Sync summary - matched/unmatched counts" }
 *       400: { description: Invalid leaderboard data }
 */
router.post('/contest/:contestId', authenticate, requireAdmin, syncController.syncContest);

export default router;