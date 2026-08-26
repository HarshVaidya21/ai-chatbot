const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const rateLimiter = async (req, res, next) => {
  try {
    const userId = req.userId; // set by authMiddleware, which runs before this
    const key = `ratelimit:${userId}`;
    const LIMIT = 10;      // max requests
    const WINDOW = 60;     // per 60 seconds

    // increment the count for this user
    const count = await redis.incr(key);

    if (count === 1) {
      // first request in this window — set expiry of 60 seconds
      // (we only set it on count === 1 to avoid resetting the window on every request)
      await redis.expire(key, WINDOW);
    }

    if (count > LIMIT) {
      // get remaining time on the key so we can tell the user when to retry
      const ttl = await redis.ttl(key);
      return res.status(429).json({
        message: `Too many requests. Try again in ${ttl} seconds.`
      });
    }

    next(); // under the limit — allow the request through

  } catch (err) {
    // if Redis is down, don't block the user — fail open
    console.error("Redis error:", err.message);
    next();
  }
};

module.exports = rateLimiter;