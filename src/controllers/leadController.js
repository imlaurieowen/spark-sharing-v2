const { body, validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const analyticsService = require('../services/analyticsService');

const leadValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address')
];

async function capture(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, source } = req.body;

    const lead = await Lead.create({
      email,
      source: source || 'landing_page'
    });

    // Track event
    await analyticsService.trackEvent('lead_captured', null, null, { email, source });

    res.status(201).json({
      message: 'Thanks for signing up!',
      lead: { id: lead.id, email: lead.email }
    });
  } catch (error) {
    console.error('Lead capture error:', error);
    res.status(500).json({ error: 'Failed to save email. Please try again.' });
  }
}

module.exports = {
  capture,
  leadValidation
};
