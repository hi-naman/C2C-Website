import { Request, Response } from 'express';
import { JwtPayload } from '../utils/jwt';
import * as userService from '../services/user.service';
import { z } from 'zod';

const updateProfileSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  hackerrankUsername: z.string().min(1, 'HackerRank username is required'),
  bio: z.string().max(500).optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'SENIOR', 'MEMBER']),
});

const updateAvatarSchema = z.object({
  avatarUrl: z.string().url('Invalid image URL'),
});


// GET /api/users/me - own profile
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user as unknown as JwtPayload;
    const profile = await userService.getUserById(user.userId);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// PATCH /api/users/profile - complete/update profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const user = req.user as unknown as JwtPayload;

    // mark profile as complete when they submit
    const updated = await userService.updateProfile(user.userId, {
      ...parsed.data,
      isProfileComplete: true,
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    // handle unique constraint violation (phone/hackerrank already used)
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `This ${field} is already in use by another account`,
      });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// GET /api/users - admin only, list all users
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// PATCH /api/users/:id/role - admin only
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const targetId = req.params.id as string;
    const parsed = updateRoleSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    // fetch the target user
    const target = await userService.getUserById(targetId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const requester = req.user as unknown as JwtPayload;

    //an admin cannot change another admin's role
    if (target.role === 'ADMIN' && target.id !== requester.userId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change the role of another admin',
      });
    }

    //prevent an admin from demoting themselves - lockouts avoided
    if (target.id === requester.userId && parsed.data.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You cannot demote yourself',
      });
    }

    const updated = await userService.updateUserRole(targetId, parsed.data.role);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
};

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const parsed = updateAvatarSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'A valid image URL is required',
      });
    }

    const user = req.user as unknown as JwtPayload;
    const updated = await userService.updateProfile(user.userId, {
      avatarUrl: parsed.data.avatarUrl,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to update avatar' });
  }
};