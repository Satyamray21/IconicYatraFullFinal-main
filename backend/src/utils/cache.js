import redisClient from '../config/redis.js';

const isRedisReady = () => {
  try {
    return Boolean(redisClient?.isOpen && redisClient?.isReady);
  } catch {
    return false;
  }
};

/** Avoid hanging forever when Redis is reconnecting / unavailable */
const withTimeout = (promise, ms = 1500) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis operation timeout')), ms),
    ),
  ]);

export const setCache = async (key, value, ttl = 3600) => {
  if (!isRedisReady()) return false;
  try {
    const stringValue = JSON.stringify(value);
    await withTimeout(
      redisClient.set(key, stringValue, {
        EX: ttl,
      }),
    );
    return true;
  } catch (error) {
    console.error('Redis Set Error:', error.message || error);
    return false;
  }
};

export const getCache = async (key) => {
  if (!isRedisReady()) return null;
  try {
    const value = await withTimeout(redisClient.get(key));
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis Get Error:', error.message || error);
    return null;
  }
};

export const deleteCache = async (key) => {
  if (!isRedisReady()) return false;
  try {
    await withTimeout(redisClient.del(key));
    return true;
  } catch (error) {
    console.error('Redis Delete Error:', error.message || error);
    return false;
  }
};

export const clearPattern = async (pattern) => {
  if (!isRedisReady()) return false;
  try {
    // Prefer SCAN over KEYS so we don't block Redis in production
    let cursor = '0';
    const keysToDelete = [];
    do {
      const result = await withTimeout(
        redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 }),
        2000,
      );
      cursor = String(result.cursor ?? result[0] ?? '0');
      const keys = result.keys ?? result[1] ?? [];
      if (keys.length) keysToDelete.push(...keys);
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      await withTimeout(redisClient.del(keysToDelete), 2000);
    }
    return true;
  } catch (error) {
    console.error('Redis Clear Pattern Error:', error.message || error);
    return false;
  }
};
