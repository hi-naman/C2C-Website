import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as calendarController from '../controllers/calendar.controller';

const router = Router();

/**
 * @openapi
 * /api/calendar:
 *   get:
 *     summary: Get all events merged (sessions, contests, camps, hackathons)
 *     tags: [Calendar]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, enum: [1, 2, 3, 4] }
 *         description: Optional - filter events by year
 *     responses:
 *       200: { description: Merged list of events sorted by date }
 */
router.get('/', authenticate, calendarController.getCalendar);

export default router;