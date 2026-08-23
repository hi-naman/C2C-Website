import { Router } from 'express';
import passport from '../config/passport';
import { signToken,verifyToken} from '../utils/jwt';
import { env } from '../config/env';
import prisma from '../config/db';
const router = Router();

/**
 * @openapi
 * /api/auth/google:
 *   get:
 *     summary: Start Google OAuth login
 *     tags: [Auth]
 *     responses:
 *       302: { description: Redirects to Google }
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

/**
 * @openapi
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback - sets JWT cookie
 *     tags: [Auth]
 *     responses:
 *       302: { description: Redirects to frontend with auth cookie set }
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/login?error=unauthorized`,
  }),
  (req, res) => {
    const user = req.user as any;

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.cookie('token', token, {
      httpOnly: true,   // JS cannot read this
      secure: env.NODE_ENV === 'production', 
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    
    res.redirect(`${env.FRONTEND_URL}/dashboard`);
  }
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Log out - clears the auth cookie
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
});


/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current logged-in user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: Current user }
 *       401: { description: Not logged in }
 */
router.get('/me', async (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }

  try {
    const payload = verifyToken(token);
    
    // fetch fresh user data from DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        avatarUrl: true,
        isProfileComplete: true,
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

export default router;