import { Request, Response } from 'express';
import * as uploadService from '../services/upload.service';
import { z } from 'zod';

const signatureSchema = z.object({
  folder: z.enum(['forum', 'avatars']),
});

// POST /api/uploads/signature
export const getUploadSignature = async (req: Request, res: Response) => {
  try {
    const parsed = signatureSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid folder. Must be "forum" or "avatars".',
      });
    }

    const signatureData = uploadService.generateUploadSignature(parsed.data.folder);
    res.json({ success: true, data: signatureData });
  } catch (error) {
    console.error('Upload signature error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate upload signature' });
  }
};