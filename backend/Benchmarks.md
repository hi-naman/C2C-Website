# Leaderboard Caching Benchmark

## Setup
- 4,000 users across 4 year groups
- 15 contests
- 60,000 leaderboard entries
- Load tested with autocannon, 10s duration per test
- Endpoint: `GET /api/leaderboard?year=3`

## The Problem
The leaderboard aggregates `SUM(score)` across all contests per user,
grouped and sorted. This is an expensive query that re-runs on every
request when uncached.

## Results

### Low concurrency (2 connections)
| Metric        | Naive      | Redis     | Improvement |
|---------------|------------|-----------|-------------|
| Avg latency   | 36.84 ms   | 3.06 ms   | 12× faster  |
| p99 latency   | 104 ms     | 9 ms      | 11.5× faster|
| Requests/sec  | 53.30      | 554.60    | 10.4× more  |

### High concurrency (200 connections)
| Metric        | Naive      | Redis     | Improvement |
|---------------|------------|-----------|-------------|
| Avg latency   | 2906.58 ms | 345.75 ms | 8.4× faster |
| p99 latency   | 8886 ms    | 498 ms    | 17.8× faster|
| Requests/sec  | 61.10      | 570.50    | 9.3× more   |

## Key Insight
Under high concurrency, the naive approach collapses — average latency
hits ~2.9s and the slowest 1% of users wait ~8.9s. This happens because
every request competes for database connections and CPU to run the same
expensive aggregation repeatedly.

With Redis, the expensive query runs once, and subsequent requests read
the precomputed result from memory (~sub-millisecond), keeping latency
low and predictable even under load.

## Caching Strategy
- Result cached in Redis keyed by `leaderboard:year:{year}`
- TTL as a safety net (24h in production)
- Cache invalidated explicitly when the HackerRank sync adds new scores
- Between contests (when scores don't change), every read hits the cache

## Alternative Approaches Considered

We benchmarked two approaches (naive vs Redis), but there are three valid
strategies overall. Each makes a different tradeoff between read speed,
write complexity, and infrastructure.

### 1. Naive (aggregate on every request)
Run `GROUP BY userId + SUM(score) + ORDER BY` on every request.
- pro - Simplest — no extra infrastructure, no sync logic
- pro - Always accurate, never stale
- con - Collapses under load (p99 ~8.9s with 200 concurrent users)

### 2. Redis cache (what we implemented)
Aggregate once, cache the computed result in memory, serve cached reads.
- pro - Very fast reads (sub-millisecond on cache hit)
- pro - Scales well under concurrency (p99 ~0.5s with 200 concurrent users)
- con - Requires running and maintaining a Redis server
- con - Slight staleness window (mitigated by cache invalidation on sync)

### 3. Denormalized `totalScore` (not implemented)
Store a running `totalScore` field directly on the User. Update it
whenever a LeaderboardEntry changes. The leaderboard query becomes a
simple `SELECT ... ORDER BY totalScore DESC` on an indexed column — no
aggregation needed.
- pro - Fast reads with no aggregation, even without a cache
- pro - No extra infrastructure (no Redis needed)
- con - Write complexity — every score change must also update the total,
     ideally in a transaction to avoid drift
- con - Score corrections require recomputing affected users' totals

Note: denormalization still requires a database connection and disk read
on every request — it only removes the expensive aggregation, replacing
it with a cheap indexed read (~5-15ms). Redis removes the database hit
entirely, serving from memory (~0.1-1ms).

## Speed Hierarchy
Naive aggregation     ~100ms    (DB connection + disk + heavy compute)

Denormalized + index  ~5-15ms   (DB connection + disk + light query)

Redis cache           ~0.1-1ms  (RAM only, no DB hit)


### Why we chose Redis
For this project Redis was chosen primarily as a learning exercise in
caching patterns, and because it generalizes to other read-heavy
endpoints (forum feeds, calendar). For a purely leaderboard-focused
system at small scale, denormalization (approach 3) would be a simpler
choice with no extra infrastructure. The two can also be combined:
denormalized totals served through a cache for maximum read throughput.