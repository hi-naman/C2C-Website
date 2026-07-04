import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

/**
 * @openapi
 * /api/uploads/signature:
 *   post:
 *     summary: Get a Cloudinary upload signature
 *     tags: [Uploads]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [folder]
 *             properties:
 *               folder: { type: string, enum: [forum, avatars] }
 *     responses:
 *       200: { description: Signature, timestamp, cloudName, apiKey for direct upload }
 */
router.post('/signature', authenticate, uploadController.getUploadSignature);

export default router;