import { Router } from 'express';
import { authenticate, requireSenior, requireAdmin } from '../middleware/auth';
import * as contestController from '../controllers/contest.controller';

const router = Router();

// Public routes

/**
 * @openapi
 * /api/contests:
 *   get:
 *     summary: Get all contests
 *     tags: [Contests]
 *     parameters:
 *       - in: query
 *         name: yearTarget
 *         schema: { type: string, enum: [FIRST, SECOND, THIRD, FOURTH, ALL] }
 *     responses:
 *       200: { description: List of contests (hackerrankUrl hidden if locked) }
 */
router.get('/', contestController.getAllContests);

/**
 * @openapi
 * /api/contests/{id}:
 *   get:
 *     summary: Get a single contest
 *     tags: [Contests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The contest }
 *       404: { description: Not found }
 */
router.get('/:id', contestController.getContestById);


/**
 * @openapi
 * /api/contests/{id}/unlock:
 *   post:
 *     summary: Unlock a gated contest's link with an access code(give code, returns url)
 *     tags: [Contests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200: { description: Returns the hackerrankUrl }
 *       403: { description: Incorrect access code }
 */
router.post('/:id/unlock', authenticate, contestController.unlockContest);

/**
 * @openapi
 * /api/contests:
 *   post:
 *     summary: Create a contest (senior/admin only)
 *     tags: [Contests]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, hackerrankUrl, startTime, endTime]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               hackerrankUrl: { type: string }
 *               accessCode: { type: string }
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *               yearTarget: { type: string, enum: [FIRST, SECOND, THIRD, FOURTH, ALL] }
 *     responses:
 *       201: { description: Created }
 */
router.post('/', authenticate, requireSenior, contestController.createContest);

/**
 * @openapi
 * /api/contests/{id}:
 *   patch:
 *     summary: Update a contest (senior owns theirs, admin any)
 *     tags: [Contests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.patch('/:id', authenticate, requireSenior, contestController.updateContest);

/**
 * @openapi
 * /api/contests/{id}:
 *   delete:
 *     summary: Delete a contest (senior owns theirs, admin any)
 *     tags: [Contests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/:id', authenticate, requireSenior, contestController.deleteContest);

export default router;