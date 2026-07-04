import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as teamController from '../controllers/team.controller';

// mergeParams lets this router access :hackathonId from the parent route
const router = Router({ mergeParams: true });

/**
 * @openapi
 * /api/hackathons/{hackathonId}/teams:
 *   post:
 *     summary: Create a team for a hackathon
 *     tags: [Teams]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: hackathonId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teamName]
 *             properties:
 *               teamName: { type: string }
 *     responses:
 *       201: { description: Team created with a join code }
 *       400: { description: Deadline passed, not registered, or already in a team }
 */
router.post('/', authenticate, teamController.createTeam);

/**
 * @openapi
 * /api/hackathons/{hackathonId}/teams/join:
 *   post:
 *     summary: Join a team using a join code
 *     tags: [Teams]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: hackathonId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [joinCode]
 *             properties:
 *               joinCode: { type: string }
 *     responses:
 *       200: { description: Joined team }
 *       400: { description: Deadline passed, team full, or already in a team }
 *       404: { description: Invalid join code }
 */
router.post('/join', authenticate, teamController.joinTeam);

export default router;