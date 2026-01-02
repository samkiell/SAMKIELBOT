const Redis = require("ioredis");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const REDIS_URL = process.env.REDIS_URL;

let redis;
let isRedisAvailable = false;

if (REDIS_URL) {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    connectTimeout: 5000,
    retryStrategy: (times) => {
      if (times > 3) {
        isRedisAvailable = false;
        return null; // Stop retrying
      }
      return Math.min(times * 100, 2000);
    },
  });

  redis.on("error", (err) => {
    if (isRedisAvailable) {
      console.warn("[Redis] Lost connection, falling back to Memory.");
      isRedisAvailable = false;
    }
  });

  redis.on("connect", () => {
    if (!isRedisAvailable) {
      console.log("[Redis] Connected Successfully");
    }
    isRedisAvailable = true;
  });
}

// Memory Fallback
const memoryStore = new Map();

const store = {
  get: async (key) => {
    if (isRedisAvailable) return redis.get(key);
    return memoryStore.get(key);
  },
  set: async (key, value, mode, duration) => {
    if (isRedisAvailable) return redis.set(key, value, mode, duration);
    memoryStore.set(key, value);
    if (duration) {
      setTimeout(() => memoryStore.delete(key), duration * 1000);
    }
    return "OK";
  },
  lpush: async (key, value) => {
    if (isRedisAvailable) return redis.lpush(key, value);
    const list = memoryStore.get(key) || [];
    list.unshift(value);
    memoryStore.set(key, list);
    return list.length;
  },
  ltrim: async (key, start, end) => {
    if (isRedisAvailable) return redis.ltrim(key, start, end);
    const list = memoryStore.get(key) || [];
    const trimmed = list.slice(start, end + 1);
    memoryStore.set(key, trimmed);
    return "OK";
  },
  lrange: async (key, start, end) => {
    if (isRedisAvailable) return redis.lrange(key, start, end);
    const list = memoryStore.get(key) || [];
    if (end === -1) return list.slice(start);
    return list.slice(start, end + 1);
  },
  isAvailable: () => isRedisAvailable,
};

module.exports = store;
