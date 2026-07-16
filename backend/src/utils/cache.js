import redisClient from '../config/redis.js';

export const setCache = async (key, value, ttl = 3600) => {
  try {
    const stringValue = JSON.stringify(value);
    await redisClient.set(key, stringValue, {
      EX: ttl
    });
    return true;
  } catch (error) {
    console.error('Redis Set Error:', error);
    return false;
  }
};

export const getCache = async (key) => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis Get Error:', error);
    return null;
  }
};

export const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis Delete Error:', error);
    return false;
  }
};

export const clearPattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Redis Clear Pattern Error:', error);
    return false;
  }
};
