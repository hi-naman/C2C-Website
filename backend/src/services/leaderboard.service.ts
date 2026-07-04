import prisma from '../config/db';
import { redis } from '../config/redis';

const CACHE_TTL = 86400;

interface ScoreEntry {
  hackerrankUsername: string;
  score: number;
  rank: number;
}

// The expensive computation
const computeLeaderboard = async (year?: number) => {
  const aggregated = await prisma.leaderboardEntry.groupBy({
    by: ['userId'],
    _sum: { score: true },
    orderBy: { _sum: { score: 'desc' } },
  });

  const userIds = aggregated.map((entry) => entry.userId);

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      ...(year ? { year } : {}),
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      year: true,
      hackerrankUsername: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const result = aggregated
    .filter((entry) => userMap.has(entry.userId))
    .map((entry) => ({
      userId: entry.userId,
      totalScore: entry._sum.score ?? 0,
      user: userMap.get(entry.userId),
    }));

  return result.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));
};


export const getLeaderboard = async (year?: number) => {
  const cacheKey = `leaderboard:year:${year ?? 'all'}`;

  //try to get from cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  //cache miss - compute the expensive result
  const leaderboard = await computeLeaderboard(year);

  //store in cache with TTL
  await redis.set(cacheKey, JSON.stringify(leaderboard), { EX: CACHE_TTL });

  return leaderboard;
};


export const syncContestScores = async (
  contestId: string,
  entries: ScoreEntry[]
) => {
  let matched = 0;
  let unmatched: string[] = [];

  for (const entry of entries) {
    // find the user with this hackerrank username
    const user = await prisma.user.findUnique({
      where: { hackerrankUsername: entry.hackerrankUsername },
    });

    if (!user) {
      // this hackerrank user isn't a registered member - skip
      unmatched.push(entry.hackerrankUsername);
      continue;
    }

    //update if entry exists, create if not
    await prisma.leaderboardEntry.upsert({
      where: {
        userId_contestId: { userId: user.id, contestId },
      },
      update: {
        score: entry.score,
        rank: entry.rank,
        syncedAt: new Date(),
      },
      create: {
        userId: user.id,
        contestId,
        score: entry.score,
        rank: entry.rank,
      },
    });

    matched++;
  }

  //invalidate all leaderboard caches since scores changed
  await invalidateLeaderboardCache();

  return {
    totalFetched: entries.length,
    matched,
    unmatchedCount: unmatched.length,
    unmatched,
  };
};

//invalidate all leaderboard caches
export const invalidateLeaderboardCache = async () => {
  const keys = await redis.keys('leaderboard:*');
  if (keys.length > 0) {
    await redis.del(keys);
  }
};