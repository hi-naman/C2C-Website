import { Request, Response } from 'express';
import { JwtPayload } from '../utils/jwt';
import * as forumService from '../services/forum.service';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).default([]),
  imageUrls: z.array(z.string().url()).default([]),
});

const updatePostSchema = createPostSchema.partial();

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
});

// GET /api/forum
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const tag = (
      Array.isArray(req.query.tag) ? req.query.tag[0] : req.query.tag
    ) as string | undefined;

    const user = req.user as unknown as JwtPayload;
    const posts = await forumService.getAllPosts(tag, user.userId);
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
};

// GET /api/forum/:id
export const getPostById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user as unknown as JwtPayload;
    const post = await forumService.getPostById(id, user.userId);

    if (!post || post.isDeleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
};

// POST /api/forum
export const createPost = async (req: Request, res: Response) => {
  try {
    const parsed = createPostSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const user = req.user as unknown as JwtPayload;

    const post = await forumService.createPost({
      ...parsed.data,
      authorId: user.userId,
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

// PATCH /api/forum/:id - author only
export const updatePost = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = updatePostSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await forumService.getPostById(id);
    if (!existing || existing.isDeleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const user = req.user as unknown as JwtPayload;

    // Only the author can edit their post
    if (existing.authorId !== user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts',
      });
    }

    const updated = await forumService.updatePost(id, parsed.data);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
};

// DELETE /api/forum/:id - author or admin
export const deletePost = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await forumService.getPostById(id);

    if (!existing || existing.isDeleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const user = req.user as unknown as JwtPayload;

    // Author or admin can delete
    if (existing.authorId !== user.userId && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts',
      });
    }

    // Soft delete
    await forumService.softDeletePost(id);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

// POST /api/forum/:id/upvote - toggle
export const toggleUpvote = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await forumService.getPostById(id);

    if (!existing || existing.isDeleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const user = req.user as unknown as JwtPayload;
    const result = await forumService.toggleUpvote(user.userId, id);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Toggle upvote error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle upvote' });
  }
};

// POST /api/forum/:id/pin - admin toggle pin
export const togglePinPost = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user as unknown as JwtPayload;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can pin or unpin posts',
      });
    }

    const updated = await forumService.togglePinPost(id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Toggle pin post error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle pin post' });
  }
};

// POST /api/forum/:id/comments
export const createComment = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id as string;
    const parsed = createCommentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await forumService.getPostById(postId);
    if (!existing || existing.isDeleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const user = req.user as unknown as JwtPayload;

    const comment = await forumService.createComment({
      postId,
      authorId: user.userId,
      content: parsed.data.content,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create comment' });
  }
};

// DELETE /api/forum/comments/:commentId - author or admin
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const commentId = req.params.commentId as string;
    const comment = await forumService.getCommentById(commentId);

    if (!comment || comment.isDeleted) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const user = req.user as unknown as JwtPayload;

    // Author or admin can delete
    if (comment.authorId !== user.userId && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments',
      });
    }

    await forumService.softDeleteComment(commentId);
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};

// PATCH /api/forum/comments/:commentId — author only
export const updateComment = async (req: Request, res: Response) => {
  try {
    const commentId = req.params.commentId as string;
    const parsed = createCommentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const comment = await forumService.getCommentById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const user = req.user as unknown as JwtPayload;

    // Only the author can edit their comment (not even admin)
    if (comment.authorId !== user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments',
      });
    }

    const updated = await forumService.updateComment(commentId, parsed.data.content);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update comment' });
  }
};