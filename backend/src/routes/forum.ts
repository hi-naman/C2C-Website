import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as forumController from '../controllers/forum.controller';
import { strictLimiter } from '../middleware/rateLimiter';
const router = Router();

/**
 * @openapi
 * /api/forum:
 *   get:
 *     summary: Get all forum posts (login required)
 *     tags: [Forum]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of posts }
 */
router.get('/', authenticate, forumController.getAllPosts);

/**
 * @openapi
 * /api/forum/{id}:
 *   get:
 *     summary: Get a post with comments
 *     tags: [Forum]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The post with comments }
 *       404: { description: Not found }
 */
router.get('/:id', authenticate, forumController.getPostById);

/**
 * @openapi
 * /api/forum:
 *   post:
 *     summary: Create a forum post
 *     tags: [Forum]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               tags: { type: array, items: { type: string } }
 *               imageUrls: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Post created }
 *       429: { description: Rate limit exceeded }
 */
router.post('/', authenticate, strictLimiter, forumController.createPost);

/**
 * @openapi
 * /api/forum/{id}:
 *   patch:
 *     summary: Edit own post
 *     tags: [Forum]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       403: { description: Not your post }
 */
router.patch('/:id', authenticate, forumController.updatePost);

/**
 * @openapi
 * /api/forum/{id}:
 *   delete:
 *     summary: Delete a post (author or admin, soft delete)
 *     tags: [Forum]
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
router.delete('/:id', authenticate, forumController.deletePost);

/**
 * @openapi
 * /api/forum/{id}/upvote:
 *   post:
 *     summary: Toggle upvote on a post
 *     tags: [Forum]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Returns { upvoted: true|false }" }
 */
router.post('/:id/upvote', authenticate, forumController.toggleUpvote);

/**
 * @openapi
 * /api/forum/{id}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Forum]
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
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       201: { description: Comment created }
 */
router.post('/:id/comments', authenticate, forumController.createComment);

/**
 * @openapi
 * /api/forum/comments/{commentId}:
 *   patch:
 *     summary: Edit own comment
 *     tags: [Forum]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       403: { description: Not your comment }
 */
router.patch('/comments/:commentId', authenticate, forumController.updateComment);

/**
 * @openapi
 * /api/forum/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment (author or admin)
 *     tags: [Forum]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/comments/:commentId', authenticate, forumController.deleteComment);

export default router;