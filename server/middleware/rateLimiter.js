const rateLimit = require('express-rate-limit');

const aiRateLimiter = rateLimit({
  windowMs: 3600000,
  max: 20,
  keyGenerator: (req) => req.user ? `user:${req.user.id}` : req.ip,
  message: { error: 'AI rate limit reached. Please wait before making more requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { aiRateLimiter };
