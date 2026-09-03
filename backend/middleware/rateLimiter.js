const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const rateLimiter = async (req, res, next) => {
  try {
    const userId = req.userId;
    const key = `ratelimit:${userId}`;
    const LIMIT = 10;
    const WINDOW = 60;


    const count = await redis.incr(key);

    if (count === 1) {

      await redis.expire(key, WINDOW);
    }

    if (count > LIMIT) {

      const ttl = await redis.ttl(key);
      return res.status(429).json({
        message: `Too many requests. Try again in ${ttl} seconds.`
      });
    }

    next();

  } catch (err) {

    console.error("Redis error:", err.message);
    next();
  }
};

module.exports = rateLimiter;