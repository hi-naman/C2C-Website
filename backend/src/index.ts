import express from 'express';
import { env } from './config/env';
import prisma from './config/db';
import cookieParser from 'cookie-parser';
import passport from './config/passport';
import authRouter from './routes/auth'
import sessionRouter from './routes/session';
import contestRouter from './routes/contest';
import campRouter from './routes/camp';
import hackathonRouter from './routes/hackathon';
import registrationRouter from './routes/registration';
import teamRouter from './routes/team';
import forumRouter from './routes/forum';
import leaderboardRouter from './routes/leaderboard';
import { connectRedis } from './config/redis';
import userRouter from './routes/user';
import calendarRouter from './routes/calendar';
import syncRouter from './routes/sync';
import uploadRouter from './routes/upload';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter} from './middleware/rateLimiter';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

const allowedOrigins = [
  env.FRONTEND_URL,
  env.FRONTEND_URL.replace('://', '://www.')
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

//middlewares (global)
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use('/api', generalLimiter);
//routes

app.use('/api/hackathons', hackathonRouter);
app.use('/api/registrations', registrationRouter);
app.use('/api/hackathons/:hackathonId/teams', teamRouter);
app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/contests', contestRouter);
app.use('/api/camps', campRouter);
app.use('/api/forum', forumRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/users', userRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/sync', syncRouter);
app.use('/api/uploads', uploadRouter);
//serve interactive api documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//few endponts
app.get('/health', async (_req, res) => {
  try { 
    //just checks the connection works
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok', 
      message: 'C2C API is running',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected' 
    });
  }
});


app.use(notFoundHandler);
app.use(errorHandler);

//server startup
const startServer = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connected');

    await connectRedis();

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();