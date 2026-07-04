import prisma from '../src/config/db';

const NUM_USERS = 4000;
const NUM_CONTESTS = 15;

async function main() {
  console.log('Starting benchmark seed...');

  //Step 1 - create a creator user for the contests ---
  const creator = await prisma.user.upsert({
    where: { email: 'benchmark-creator@mnit.ac.in' },
    update: {},
    create: {
      id: 'benchmark-creator',
      email: 'benchmark-creator@mnit.ac.in',
      name: 'Benchmark Creator',
      googleId: 'benchmark-creator-google',
      role: 'ADMIN',
      year: 4,
    },
  });
  console.log('Creator ready');

  //Step 2-create contests
  const contestIds: string[] = [];
  for (let i = 0; i < NUM_CONTESTS; i++) {
    const contest = await prisma.contest.create({
      data: {
        title: `Benchmark Contest ${i + 1}`,
        description: 'Seeded contest for benchmarking',
        hackerrankUrl: `https://hackerrank.com/contests/bench-${i + 1}`,
        startTime: new Date(),
        endTime: new Date(Date.now() + 7200000),
        yearTarget: 'ALL',
        createdBy: creator.id,
      },
    });
    contestIds.push(contest.id);
  }
  console.log(`Created ${NUM_CONTESTS} contests`);

  // Step 3 - create users in bulk 
  const users = [];
  for (let i = 0; i < NUM_USERS; i++) {
    users.push({
      id: `bench-user-${i}`,
      email: `bench${i}@mnit.ac.in`,
      name: `Bench User ${i}`,
      googleId: `bench-google-${i}`,
      role: 'MEMBER' as const,
      year: (i % 4) + 1, 
      isProfileComplete: true,
    });
  }

  // createMany is much faster than creating one by one
  await prisma.user.createMany({ data: users, skipDuplicates: true });
  console.log(`Created ${NUM_USERS} users`);

  // Step 4 -create leaderboard entries in bulk
  const entries = [];
  for (let i = 0; i < NUM_USERS; i++) {
    for (let j = 0; j < NUM_CONTESTS; j++) {
      entries.push({
        userId: `bench-user-${i}`,
        contestId: contestIds[j],
        score: Math.floor(Math.random() * 500), // random score 0-499
      });
    }
  }

  // insert in chunks to avoid overwhelming the DB in one query
  const CHUNK_SIZE = 5000;
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    await prisma.leaderboardEntry.createMany({ data: chunk, skipDuplicates: true });
    console.log(`  Inserted ${Math.min(i + CHUNK_SIZE, entries.length)} / ${entries.length} entries`);
  }

  console.log('Benchmark seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });