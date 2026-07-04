import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as registrationController from '../controllers/registration.controller';

const router = Router();

/**
 * @openapi
 * /api/registrations/camp/{campId}:
 *   post:
 *     summary: Register for a camp
 *     tags: [Registrations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: campId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Registered }
 *       400: { description: Profile incomplete, full, already registered, or year ineligible }
 */
router.post('/camp/:campId', authenticate, registrationController.registerForCamp);

/**
 * @openapi
 * /api/registrations/hackathon/{hackathonId}:
 *   post:
 *     summary: Register for a hackathon
 *     tags: [Registrations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: hackathonId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Registered }
 *       400: { description: Profile incomplete, deadline passed, or already registered }
 */
router.post('/hackathon/:hackathonId', authenticate, registrationController.registerForHackathon);

/**
 * @openapi
 * /api/registrations/my:
 *   get:
 *     summary: Get my registrations
 *     tags: [Registrations]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: List of the user's registrations }
 */
router.get('/my', authenticate, registrationController.getMyRegistrations);

export default router;