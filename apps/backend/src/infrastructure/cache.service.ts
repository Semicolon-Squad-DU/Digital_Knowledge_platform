import Redis from "ioredis";
import { config } from "../core/config";
import { logger } from "../core/config/logger";

// Performance NFR: read-heavy, expensive-to-compute endpoints (admin
// analytics aggregates) get a short-TTL Redis cache in front of the DB
// queries. Deliberately fail-open: any Redis error (down, unreachable,
// timeout) is logged and treated as a cache miss, never surfaced to the
// caller — caching is a performance optimization, not something a request
// should fail over. `lazyConnect` + a bounded retry strategy means a Redis
// outage doesn't retry-storm or block server startup.
let client: Redis | null = null;
function getClient(): Redis {
  if (!client) {
    client = new Redis(config.redis.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    client.on("error", (err) => {
      logger.warn("Redis cache error", { error: err.message });
    });
  }
  return client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await getClient().get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    logger.warn("Cache read failed, falling through to source", { key, error: (err as Error).message });
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await getClient().set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    logger.warn("Cache write failed", { key, error: (err as Error).message });
  }
}

export async function cacheDelByPrefix(prefix: string): Promise<void> {
  try {
    const redis = getClient();
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    logger.warn("Cache invalidation failed", { prefix, error: (err as Error).message });
  }
}

// Wraps an expensive async computation with a get-or-compute-and-set cache
// pattern. Used by handlers that just want "cache this for N seconds"
// without touching cacheGet/cacheSet directly.
export async function cached<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;

  const value = await compute();
  void cacheSet(key, value, ttlSeconds);
  return value;
}
