const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const rateLimit = require('express-rate-limit');

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: 'Too many attempts. Please try again later.' }
});

// POST /api/auth/register
router.post('/register',
  authLimiter,
  authController.registerValidation,
  authController.register
);

// POST /api/auth/login
router.post('/login',
  authLimiter,
  authController.loginValidation,
  authController.login
);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/logout (convenience)
router.get('/logout', authController.logout);

module.exports = router;
