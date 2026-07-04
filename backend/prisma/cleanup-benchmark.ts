import prisma from '../src/config/db';

async function main() {
  console.log('Cleaning up benchmark data...');

  // Delete in correct order (children before parents due to foreign keys)

  // 1. Delete leaderboard entries for bench users
  const entries = await prisma.leaderboardEntry.deleteMany({
    where: { userId: { startsWith: 'bench-user-' } },
  });
  console.log(`Deleted ${entries.count} leaderboard entries`);

  // 2. Delete benchmark contests
  const contests = await prisma.contest.deleteMany({
    where: { createdBy: 'benchmark-creator' },
  });
  console.log(`Deleted ${contests.count} contests`);

  // 3. Delete bench users
  const users = await prisma.user.deleteMany({
    where: { id: { startsWith: 'bench-user-' } },
  });
  console.log(`Deleted ${users.count} users`);

  // 4. Delete the benchmark creator
  await prisma.user.deleteMany({
    where: { id: 'benchmark-creator' },
  });
  console.log('Deleted benchmark creator');

  console.log('Cleanup complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });