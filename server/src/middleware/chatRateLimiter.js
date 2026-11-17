const rateLimit = require('express-rate-limit');

/**
 * Rate limiter middleware for public customer chat endpoint.
 * Prevents spam and protects the Gemini API quota.
 * Allows 40 requests per 10 minutes per IP address.
 */
const chatRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many messages sent from this connection. Please wait a few minutes before asking another question.'
  }
});

module.exports = chatRateLimiter;
