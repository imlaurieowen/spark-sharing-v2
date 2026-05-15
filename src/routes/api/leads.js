const express = require('express');
const router = express.Router();
const leadController = require('../../controllers/leadController');
const rateLimit = require('express-rate-limit');

// Rate limit for lead capture
const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per hour
  message: { error: 'Too many submissions. Please try again later.' }
});

// POST /api/leads - Capture email
router.post('/', leadLimiter, leadController.leadValidation, leadController.capture);

module.exports = router;
