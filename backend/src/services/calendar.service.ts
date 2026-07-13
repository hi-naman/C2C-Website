import prisma from '../config/db';
import { redis } from '../config/redis';

const CACHE_TTL = 86400; // 24h safety net; invalidated on event create/update/delete

// year filter helper - maps year number to YearTarget enum values that apply
const yearTargets = (year?: number): string[] | undefined => {
  if (!year) return undefined;
  const map: Record<number, string> = { 1: 'FIRST', 2: 'SECOND', 3: 'THIRD', 4: 'FOURTH' };
  // a user of a given year sees events targeted at their year or at ALL
  return [map[year], 'ALL'];
};

const computeCalendar = async (year?: number) => {
  const targets = yearTargets(year);
  const yearFilter = targets ? { yearTarget: { hasSome: targets as any } } : {};

  //fetch from all 4 sources in parallel
  const [sessions, contests, camps, hackathons] = await Promise.all([
    prisma.session.findMany({
      where: yearFilter,
      select: { id: true, title: true, date: true, yearTarget: true },
    }),
    prisma.contest.findMany({
      where: yearFilter,
      select: { id: true, title: true, startTime: true, endTime: true, yearTarget: true },
    }),
    prisma.camp.findMany({
      where: yearFilter,
      select: { id: true, title: true, startDate: true, endDate: true, yearTarget: true },
    }),
    prisma.hackathon.findMany({
      select: {
        id: true,
        title: true,
        regDeadline: true,
        submissionDeadline: true,
      },
    }),
  ]);

  //normalise all into a unified shape
  const events = [
    ...sessions.map((s) => ({
      id: s.id,
      type: 'SESSION',
      title: s.title,
      date: s.date,
      endDate: null,
      yearTarget: s.yearTarget,
    })),
    ...contests.map((c) => ({
      id: c.id,
      type: 'CONTEST',
      title: c.title,
      date: c.startTime,
      endDate: c.endTime,
      yearTarget: c.yearTarget,
    })),
    ...camps.map((c) => ({
      id: c.id,
      type: 'CAMP',
      title: c.title,
      date: c.startDate,
      endDate: c.endDate,
      yearTarget: c.yearTarget,
    })),
    ...hackathons.map((h) => ({
      id: h.id,
      type: 'HACKATHON',
      title: h.title,
      date: h.regDeadline,
      endDate: h.submissionDeadline,
      yearTarget: ['ALL'],
    })),
  ];

  //sort by date -> ascending
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return events;
};

export const getCalendar = async (year?: number) => {
  const cacheKey = `calendar:year:${year ?? 'all'}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const events = await computeCalendar(year);
  await redis.set(cacheKey, JSON.stringify(events), { EX: CACHE_TTL });

  return events;
};

// invalidate all calendar caches - called when any event is created/updated/deleted
export const invalidateCalendarCache = async () => {
  const keys = await redis.keys('calendar:*');
  if (keys.length > 0) {
    await redis.del(keys);
  }
};