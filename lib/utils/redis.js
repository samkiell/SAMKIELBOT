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
      console.warn("[Redis] Not available, falling back to Memory.");
      isRedisAvailable = false;
    }
  });

  redis.on("connect", () => {
    console.log("[Redis] Connected Successfully");
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
  isAvailable: () => isRedisAvailable,
};

module.exports = store;
