import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import prisma from './db';
import { getYearFromEmail } from '../utils/academicYear';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        // Step 1 - check email exists
        if (!email) {
          return done(new Error('No email found from Google'));
        }

        // Step 2 - check college email domain
        if (env.ALLOWED_EMAIL_DOMAIN !== '*' && !email.endsWith(`@${env.ALLOWED_EMAIL_DOMAIN}`)) {
          return done(new Error(`Only @${env.ALLOWED_EMAIL_DOMAIN} emails are allowed`));
        }

        // Step 3 - check if user already exists
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        // Step 4 - if not, create them
        if (!user) {
          const year = getYearFromEmail(email) ?? 1; // compute from email

          user = await prisma.user.create({
            data: {
              googleId: profile.id,
              email,
              name: profile.displayName,
              avatarUrl: profile.photos?.[0]?.value,
              year,
              isProfileComplete: false,
            },
          });
        }

        // Step 5 - pass user to the route handler
        return done(null, user);
      }
      catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;