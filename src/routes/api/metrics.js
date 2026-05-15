const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth');
const analyticsController = require('../../controllers/analyticsController');

// GET /api/metrics - Get analytics metrics (auth required)
router.get('/', requireAuth, analyticsController.getMetrics);

// POST /api/events - Track event (public, for share tracking)
router.post('/events', analyticsController.trackEvent);

module.exports = router;
