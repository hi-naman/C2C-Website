import autocannon from 'autocannon';

const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMDAxIiwiZW1haWwiOiJ0ZXN0QG1uaXQuYWMuaW4iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3ODE2MDMzODMsImV4cCI6MTc4MjIwODE4M30.eRLrjCe9Qih0D_FMqaVxfPotMbKuROGLkrwgp6-Qktk';

  //aggregate query, disk read each time - naive approach
const URL = 'http://localhost:5000/api/leaderboard?year=3';

async function runBenchmark(connections: number, label: string) {
  console.log(`\n========================================`);
  console.log(`  ${label}`);
  console.log(`  Concurrent connections: ${connections}`);
  console.log(`========================================`);

  const result = await autocannon({
    url: URL,
    connections,         // how many simultaneous requests
    duration: 10,        // run for 10 seconds
    headers: {
      cookie: `token=${TOKEN}`,
    },
  });

  console.log(`Requests/sec:     ${result.requests.average.toFixed(2)}`);
  console.log(`Avg latency:      ${result.latency.average.toFixed(2)} ms`);
  console.log(`p99 latency:      ${result.latency.p99.toFixed(2)} ms`);
  console.log(`Max latency:      ${result.latency.max.toFixed(2)} ms`);
  console.log(`Total requests:   ${result.requests.total}`);
  console.log(`Errors:           ${result.errors}`);
  console.log(`Timeouts:         ${result.timeouts}`);

  return result;
}

async function main() {
  // Test 1 - low concurrency (1-2 at a time)
  await runBenchmark(2, 'TEST 1 — Low concurrency (2 connections)');

  // Test 2 - high concurrency (many at once)
  await runBenchmark(200, 'TEST 2 — High concurrency (100 connections)');
}

main();