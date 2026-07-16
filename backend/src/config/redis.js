import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.log('Redis: Max retries reached. Caching disabled.');
        return false; // Stop retrying
      }
      return Math.min(retries * 100, 3000); // Retry every 3 seconds
    }
  }
});

redisClient.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.log('⚠️ Redis Server not found. Caching will be skipped.');
  } else {
    console.log('Redis Client Error', err);
  }
});

redisClient.on('connect', () => console.log('✅ Redis Client Connected'));

// Connect without blocking the entire app if it fails
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.log('❌ Failed to connect to Redis on startup. App will run without cache.');
  }
})();

export default redisClient;
