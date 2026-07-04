import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const router = Router();

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get my profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: The user's profile }
 */
router.get('/me', authenticate, userController.getMyProfile);

/**
 * @openapi
 * /api/users/profile:
 *   patch:
 *     summary: Complete or update profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, hackerrankUsername]
 *             properties:
 *               phone: { type: string }
 *               hackerrankUsername: { type: string }
 *               bio: { type: string }
 *     responses:
 *       200: { description: Updated profile }
 *       400: { description: Phone or username already in use }
 */
router.patch('/profile', authenticate, userController.updateProfile);

/**
 * @openapi
 * /api/users/avatar:
 *   patch:
 *     summary: Update avatar URL
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [avatarUrl]
 *             properties:
 *               avatarUrl: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.patch('/avatar', authenticate, userController.updateAvatar);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: List of users }
 */
router.get('/', authenticate, requireAdmin, userController.getAllUsers);

/**
 * @openapi
 * /api/users/{id}/role:
 *   patch:
 *     summary: Change a user's role (admin only, cannot demote other admins)
 *     tags: [Users]
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
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [ADMIN, SENIOR, MEMBER] }
 *     responses:
 *       200: { description: Role updated }
 *       403: { description: Cannot change another admin's role or demote self }
 */
router.patch('/:id/role', authenticate, requireAdmin, userController.updateUserRole);

export default router;