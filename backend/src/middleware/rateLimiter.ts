import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis';

// General limiter - applies to all API routes
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // max 100 requests per minute per IP
  standardHeaders: true, // send RateLimit-* headers
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args),
    prefix: 'rl:general:',
  }),
});

// strict limiter - for write-heavy/sensitive routes (forum posts, comments)
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down' },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args),
    prefix: 'rl:strict:',
  }),
});