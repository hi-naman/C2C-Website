import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as campController from '../controllers/camp.controller';

const router = Router();

/**
 * @openapi
 * /api/camps:
 *   get:
 *     summary: Get all camps
 *     tags: [Camps]
 *     parameters:
 *       - in: query
 *         name: yearTarget
 *         schema: { type: string, enum: [FIRST, SECOND, THIRD, FOURTH, ALL] }
 *     responses:
 *       200: { description: List of camps }
 */
router.get('/', campController.getAllCamps);

/**
 * @openapi
 * /api/camps/{id}:
 *   get:
 *     summary: Get a single camp
 *     tags: [Camps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The camp }
 *       404: { description: Not found }
 */
router.get('/:id', campController.getCampById);

/**
 * @openapi
 * /api/camps:
 *   post:
 *     summary: Create a camp (admin only)
 *     tags: [Camps]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, type, startDate, endDate]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               type: { type: string, enum: [WINTER, SUMMER] }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *               venue: { type: string }
 *               maxSeats: { type: integer }
 *               tags: { type: array, items: { type: string } }
 *               yearTarget: { type: string, enum: [FIRST, SECOND, THIRD, FOURTH, ALL] }
 *     responses:
 *       201: { description: Created }
 */
router.post('/', authenticate, requireAdmin, campController.createCamp);

/**
 * @openapi
 * /api/camps/{id}:
 *   patch:
 *     summary: Update a camp (admin only)
 *     tags: [Camps]
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
router.patch('/:id', authenticate, requireAdmin, campController.updateCamp);

/**
 * @openapi
 * /api/camps/{id}:
 *   delete:
 *     summary: Delete a camp (admin only)
 *     tags: [Camps]
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
router.delete('/:id', authenticate, requireAdmin, campController.deleteCamp);

/**
 * @openapi
 * /api/camps/{id}/registrations:
 *   get:
 *     summary: Get camp registrations (admin only)
 *     tags: [Camps]
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
router.get('/:id/registrations', authenticate, requireAdmin, campController.getCampRegistrations);

export default router;