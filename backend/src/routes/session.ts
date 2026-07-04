import { Router } from 'express';
import { authenticate, requireSenior, requireAdmin } from '../middleware/auth';
import * as sessionController from '../controllers/session.controller';

const router = Router();

// Public routes — anyone can view sessions
/**
 * @openapi
 * /api/sessions:
 *   get:
 *     summary: Get all sessions
 *     tags: [Sessions]
 *     parameters:
 *       - in: query
 *         name: yearTarget
 *         schema:
 *           type: string
 *           enum: [FIRST, SECOND, THIRD, FOURTH, ALL]
 *         description: Filter sessions by target year
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/', sessionController.getAllSessions);

/**
 * @openapi
 * /api/sessions/{id}:
 *   get:
 *     summary: Get a single session by ID
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The session
 *       404:
 *         description: Session not found
 */
router.get('/:id', sessionController.getSessionById);


/**
 * @openapi
 * /api/sessions:
 *   post:
 *     summary: Create a session (senior/admin only)
 *     tags: [Sessions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, speakerName, description, date, venue]
 *             properties:
 *               title: { type: string }
 *               speakerName: { type: string }
 *               speakerBio: { type: string }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *               venue: { type: string }
 *               slidesUrl: { type: string }
 *               tags: { type: array, items: { type: string } }
 *               yearTarget: { type: string, enum: [FIRST, SECOND, THIRD, FOURTH, ALL] }
 *     responses:
 *       201:
 *         description: Session created
 *       403:
 *         description: Not authorized
 */
router.post('/', authenticate, requireSenior, sessionController.createSession);

/**
 * @openapi
 * /api/sessions/{id}:
 *   patch:
 *     summary: Update a session (senior owns theirs, admin any)
 *     tags: [Sessions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session updated
 */
router.patch('/:id', authenticate, requireSenior, sessionController.updateSession);

/**
 * @openapi
 * /api/sessions/{id}:
 *   delete:
 *     summary: Delete a session (senior owns theirs, admin any)
 *     tags: [Sessions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session deleted
 */
router.delete('/:id', authenticate, requireSenior, sessionController.deleteSession);

export default router;