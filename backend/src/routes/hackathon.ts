import { Router } from 'express';
import { authenticate, requireAdmin, optionalAuthenticate } from '../middleware/auth';
import * as hackathonController from '../controllers/hackathon.controller';

const router = Router();

/**
 * @openapi
 * /api/hackathons:
 *   get:
 *     summary: Get all hackathons (list view with counts)
 *     tags: [Hackathons]
 *     responses:
 *       200: { description: List of hackathons }
 */
router.get('/', hackathonController.getAllHackathons);

/**
 * @openapi
 * /api/hackathons/{id}:
 *   get:
 *     summary: Get a hackathon (data varies by role - public/member/admin)
 *     tags: [Hackathons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The hackathon (fields depend on viewer's role) }
 *       404: { description: Not found }
 */
router.get('/:id', optionalAuthenticate, hackathonController.getHackathonById);

/**
 * @openapi
 * /api/hackathons:
 *   post:
 *     summary: Create a hackathon (admin only)
 *     tags: [Hackathons]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, problemStatement, regDeadline, submissionDeadline, maxTeamSize, minTeamSize]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               problemStatement: { type: string }
 *               rules: { type: string }
 *               prizes: { type: string }
 *               regDeadline: { type: string, format: date-time }
 *               submissionDeadline: { type: string, format: date-time }
 *               maxTeamSize: { type: integer }
 *               minTeamSize: { type: integer }
 *               tags: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Created }
 */
router.post('/', authenticate, requireAdmin, hackathonController.createHackathon);

/**
 * @openapi
 * /api/hackathons/{id}:
 *   patch:
 *     summary: Update a hackathon (admin only)
 *     tags: [Hackathons]
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
router.patch('/:id', authenticate, requireAdmin, hackathonController.updateHackathon);

/**
 * @openapi
 * /api/hackathons/{id}:
 *   delete:
 *     summary: Delete a hackathon (admin only)
 *     tags: [Hackathons]
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
router.delete('/:id', authenticate, requireAdmin, hackathonController.deleteHackathon);

/**
 * @openapi
 * /api/hackathons/{id}/registrations:
 *   get:
 *     summary: Get hackathon registrations (admin only)
 *     tags: [Hackathons]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of registrations with user details }
 */
router.get('/:id/registrations', authenticate, requireAdmin, hackathonController.getHackathonRegistrations);

export default router;