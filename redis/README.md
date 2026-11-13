# Redis Notes

Redis is an **in-memory data structure store** commonly used as a cache, database,
message broker, and streaming engine. These notes begin with the performance
problem Redis solves and then build toward caching, distributed systems, Valkey,
and Redis Streams.

## Additional Documentation

- [Project setup, commands, and troubleshooting](./PROJECT-SETUP.md)

## Table of Contents

1. [The problem Redis solves](#1-the-problem-redis-solves)
2. [Why RAM helps](#2-why-ram-helps)
3. [Caching an expensive result](#3-caching-an-expensive-result)
4. [The cache invalidation problem](#4-the-cache-invalidation-problem)
5. [Limited memory and eviction](#5-limited-memory-and-eviction)
6. [What Redis is](#6-what-redis-is)
7. [Redis in a distributed system](#7-redis-in-a-distributed-system)
8. [Real-world risks and solutions](#8-real-world-risks-and-solutions)
9. [Valkey](#9-valkey)
10. [Redis Streams for high-throughput data](#10-redis-streams-for-high-throughput-data)
11. [Quick summary](#11-quick-summary)

---

## 1. The problem Redis solves

In a traditional application, every user request reaches the application server,
and the server reads from or writes to a database.

```mermaid
flowchart LR
    U1[User 1] -->|Request| APP[Application Server]
    U2[User 2] -->|Request| APP
    U3[User 3] -->|Request| APP
    APP -->|Query / write| DB[(Primary Database)]
    DB --> DISK[(SSD / HDD\nSecondary Storage)]
    DB -->|Result| APP
    APP -->|Response| U1
    APP -->|Response| U2
    APP -->|Response| U3
```

The database provides a reliable data layer that keeps data consistent and
durable. This reliability has a cost: parsing queries, finding data, reading
storage pages, joining rows, locking, and transferring results all add overhead.

Modern users expect pages and APIs to respond quickly. A fast internet connection
cannot fix a slow database query, so repeated database work can still produce a
slow application and a poor user experience.

> **Core problem:** data stored on durable secondary storage is essential, but
> repeatedly computing or fetching the same result can be too slow.

Redis does not replace the primary database in this scenario. It adds a fast
in-memory layer for data that benefits from quick access.

---

## 2. Why RAM helps

### Primary memory (RAM)

**Advantages**

- Very fast compared with SSD or HDD storage.
- Well suited to frequently accessed and temporary data.
- Lets an application serve a previously computed result without rerunning the
  original database query.

**Limitations**

- RAM is volatile: data can be lost when the process or machine stops unless a
  persistence mechanism is configured.
- RAM has a smaller capacity and a higher cost per gigabyte than disk storage.
- Its size is limited, so the application cannot keep everything in memory.

| Property | RAM | SSD/HDD |
| --- | --- | --- |
| Access speed | Very fast | Slower |
| Capacity | Usually smaller | Usually much larger |
| Data after power loss | Volatile by default | Persistent |
| Typical role here | Cache / hot data | Primary durable data |

Exact latency depends on the hardware, network, data size, and command. The
important point is that an in-memory lookup is normally much faster than repeating
a complex database operation.

---

## 3. Caching an expensive result

Suppose an `orders` table contains 100 million rows. Calculating a large aggregate
such as total sales may be expensive:

```sql
SELECT SUM(amount) FROM orders;
```

If the result is requested repeatedly, the application can calculate it once and
store it in Redis under a key such as `orders:total-sales`.

### Cache-aside read pattern

```mermaid
flowchart TD
    USER[User] --> APP[Application Server]
    APP -->|1. GET orders:total-sales| REDIS[(Redis Cache)]
    REDIS --> HIT{Key found?}
    HIT -->|Yes: cache hit| RETURN[Return cached result]
    HIT -->|No: cache miss| DB[(Primary Database)]
    DB -->|2. Run expensive query| APP
    APP -->|3. SET result with TTL| REDIS
    APP --> RETURN
    RETURN --> USER
```

The application follows this sequence:

1. Ask Redis for the cached value.
2. If it exists, return it immediately. This is a **cache hit**.
3. If it does not exist, query the database. This is a **cache miss**.
4. Save the result in Redis with an expiration time (TTL).
5. Return the result to the user.

Example pseudocode:

```ts
async function getTotalSales() {
  const cacheKey = "orders:total-sales";
  const cachedValue = await redis.get(cacheKey);

  if (cachedValue !== null) {
    return Number(cachedValue);
  }

  const total = await db.calculateTotalSales();
  await redis.set(cacheKey, String(total), "EX", 60);
  return total;
}
```

The database remains the source of truth; Redis holds a temporary copy of the
computed result.

---

## 4. The cache invalidation problem

Assume Redis currently contains a total of `500M`. A new order is written to the
database and the real total becomes `600M`. If the cached value is not updated or
deleted, users continue receiving the stale `500M` result.

This is the **cache invalidation problem**: the primary data changes while its
cached copy remains old.

### Invalidate the cache after a successful write

```mermaid
sequenceDiagram
    participant U as User
    participant A as Application
    participant D as Database
    participant R as Redis

    U->>A: Update an order
    A->>D: Write and commit the change
    D-->>A: Success
    A->>R: DEL orders:total-sales
    R-->>A: Cache key removed
    A-->>U: Update successful
    Note over A,R: The next read is a cache miss and rebuilds the value.
```

Example pseudocode:

```ts
async function updateOrder(orderId: string, input: UpdateOrderInput) {
  await db.updateOrder(orderId, input);
  await redis.del("orders:total-sales");
}
```

Important real-world rules:

- Invalidate the key only after the database transaction succeeds.
- Give cached values a TTL so stale entries eventually expire even if an
  invalidation is missed.
- Delete or refresh only the affected keys instead of clearing the entire cache.
- Concurrent reads and writes can still create race conditions, so critical data
  may require versioned keys, locks, or a more carefully designed write strategy.

Clearing every cached value after each write is simple, but it removes useful hot
data and causes many requests to hit the database again.

---

## 5. Limited memory and eviction

RAM is finite. Suppose a cache can hold four items:

```text
Current cache: [1] [2] [3] [4]
New item:      [5]
```

When item `5` arrives, Redis may need to remove an older key. With an LRU-style
policy, it evicts a key that has not been used recently.

```mermaid
flowchart LR
    NEW[New key: 5] --> FULL{Memory limit reached?}
    FULL -->|No| ADD[Store key 5]
    FULL -->|Yes| POLICY[Apply configured eviction policy]
    POLICY --> EVICT[Evict a candidate key]
    EVICT --> ADD
```

Redis memory behavior is controlled using `maxmemory` and
`maxmemory-policy`. Available policies include:

- `allkeys-lru`: evict least-recently-used keys from all keys.
- `allkeys-lfu`: evict least-frequently-used keys.
- `volatile-lru`: apply LRU only to keys that have a TTL.
- `volatile-ttl`: evict expiring keys with the shortest remaining TTL.
- `noeviction`: reject new writes when the memory limit is reached.

Redis uses an approximation of LRU rather than maintaining a perfect global LRU
list. The correct policy depends on whether Redis is being used purely as a cache
or also holds data that must not be evicted.

---

## 6. What Redis is

Redis can be understood as a standardized server and data-structure layer that
manages data primarily in memory.

> **Redis is an in-memory data structure store that can be used as a cache,
> database, message broker, and streaming engine.**

Redis stores data using keys and supports more than basic string values, including
hashes, lists, sets, sorted sets, streams, and other data structures.

```text
user:42:name       -> "Vansh"
product:10:stock   -> "37"
orders:total-sales -> "600000000"
```

### A useful analogy

- A relational database provides an organized interface over durable secondary
  storage.
- Redis provides a network-accessible data-structure interface over memory, with
  optional disk persistence.

Redis runs as its own server process. Application servers connect to it over the
network, usually on port `6379`, and issue commands such as `GET`, `SET`, `DEL`,
`HGET`, and `XADD`.

### Redis is not always non-persistent

Redis is memory-first, but saying that it is never persistent is incorrect. Redis
supports:

- **RDB snapshots**: periodic point-in-time snapshots.
- **AOF (Append Only File)**: a log of write operations.
- **RDB + AOF**: both mechanisms together.
- **No persistence**: common when Redis is used only as a disposable cache.

Durability must be configured according to the use case. Even with persistence,
Redis should not automatically be treated as a replacement for the application's
primary database.

---

## 7. Redis in a distributed system

When an application is scaled horizontally, many application servers can share
one logical Redis cache. A request can reach any application instance and still
use the same cached data.

```mermaid
flowchart TB
    USERS[Users] --> LB[Load Balancer]
    LB --> A1[Application Server 1]
    LB --> A2[Application Server 2]
    LB --> A3[Application Server 3]

    A1 --> REDIS[(Shared Redis Cache)]
    A2 --> REDIS
    A3 --> REDIS

    A1 --> DB[(Primary Database)]
    A2 --> DB
    A3 --> DB

    REDIS -. Cache miss / invalidation .-> DB
```

This is a **distributed cache** because separate application processes use a
shared cache service.

Benefits include:

- All application instances see the same cached value.
- Expensive results do not need to be recomputed by every server.
- Application servers remain easier to scale because cached state is outside the
  individual process.
- Redis commands are atomic, so many clients can safely operate on keys; however,
  multi-step application workflows can still have race conditions.

---

## 8. Real-world risks and solutions

Adding Redis improves speed, but it introduces another system that must be
designed and operated correctly.

| Risk | What can happen | Common protection |
| --- | --- | --- |
| Stale cache | Redis returns old data after a DB update | Invalidation, TTLs, versioned keys |
| Memory fills | New writes fail or useful keys are removed | `maxmemory`, an appropriate eviction policy, monitoring |
| Cache flush | Many requests suddenly hit the DB | Avoid broad clears, add jittered TTLs, warm important keys |
| Redis server failure | Cache becomes unavailable | Timeouts, DB fallback, replicas, Sentinel/managed HA |
| Cache stampede | Many clients rebuild the same missing key | Lock/single-flight, stale-while-revalidate, TTL jitter |
| Durable-data loss | Memory-only data disappears after failure | RDB/AOF, replication, or keep the DB as source of truth |

An application should treat a cache failure as a performance problem rather than
an immediate correctness failure whenever possible. If Redis is unavailable, the
application can temporarily read from the primary database, subject to rate and
capacity limits.

---

## 9. Valkey

Valkey is a vendor-neutral, BSD-licensed, open-source in-memory data store and a
continuation of Redis OSS. It is compatible with Redis OSS 7.2 and earlier
open-source versions, which makes migration straightforward for compatible
workloads and clients.

This project already uses the official Valkey container image:

```yaml
services:
  redis:
    image: valkey/valkey:latest
    ports:
      - "6379:6379"
```

For repeatable production builds, pin a tested version instead of relying on
`latest`:

```yaml
image: valkey/valkey:<tested-version>
```

Start it with:

```bash
docker compose up -d
```

Existing Redis-compatible clients such as `ioredis` can connect to Valkey through
the same Redis protocol. Compatibility should still be tested before migrating a
production workload, especially when moving between newer major versions.

---

## 10. Redis Streams for high-throughput data

A database can become overloaded when producers write bursts of events directly
to it. Redis Streams provides an append-only, ordered log that can sit between
producers and downstream workers.

```mermaid
flowchart LR
    P1[Producer 1] -->|XADD| STREAM[(Redis Stream)]
    P2[Producer 2] -->|XADD| STREAM
    P3[Producer 3] -->|XADD| STREAM

    STREAM -->|XREADGROUP| C1[Batch Worker 1]
    STREAM -->|XREADGROUP| C2[Batch Worker 2]
    C1 -->|Batch writes| DB[(Primary Database)]
    C2 -->|Batch writes| DB
    C1 -->|XACK after success| STREAM
    C2 -->|XACK after success| STREAM

    STREAM -->|Independent consumer group| LIVE[Real-time Consumer]
```

Real-world flow:

1. Producers append events with `XADD`.
2. Redis stores every event with an ordered stream ID.
3. Workers in a consumer group use `XREADGROUP` to share the work.
4. Workers process events and write them to the database, often in batches.
5. A worker sends `XACK` only after processing succeeds.
6. Pending, failed, and retried messages must be monitored.

Streams can absorb bursts and allow consumers to process data at a controlled
rate. They do not make database capacity unlimited: if producers remain faster
than consumers, the stream backlog keeps growing. Production systems therefore
need retention/trimming, memory limits, monitoring, retry handling, and idempotent
consumers.

Redis Streams is useful for event processing, telemetry, activity feeds,
background jobs, and moving data into durable storage. For large, long-retention,
multi-partition event platforms, a dedicated streaming system may be more
appropriate.

---

## 11. Quick summary

```mermaid
flowchart LR
    PROBLEM[Repeated DB work is slow] --> CACHE[Cache hot/computed data in Redis]
    CACHE --> FAST[Fast repeated reads]
    CACHE --> ISSUES[New concerns]
    ISSUES --> INVALIDATE[Invalidation and TTL]
    ISSUES --> MEMORY[Memory limits and eviction]
    ISSUES --> FAILURE[Failure handling and persistence]
    CACHE --> SCALE[Shared cache for many app servers]
    CACHE --> STREAMS[Streams for buffered event processing]
```

- The primary database remains the source of truth in the cache-aside pattern.
- Redis keeps frequently used or computed data in memory for fast access.
- Cache hits reduce database load; cache misses rebuild the cached value.
- Writes require a cache invalidation strategy to avoid stale results.
- TTLs and eviction policies control the lifetime of keys and memory usage.
- Multiple application servers can share Redis as a distributed cache.
- Redis can use RDB and/or AOF persistence; it is not inherently non-persistent.
- Valkey is an open-source Redis-compatible alternative.
- Redis Streams can buffer and distribute high-throughput event processing.

## Official references

- [Redis introduction](https://redis.io/about/)
- [Redis key eviction](https://redis.io/docs/latest/reference/eviction/)
- [Redis persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
- [Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/)
- [Valkey introduction](https://valkey.io/topics/introduction/)
- [Migrating from Redis to Valkey](https://valkey.io/topics/migration/)
