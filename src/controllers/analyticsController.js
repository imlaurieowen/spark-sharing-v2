const analyticsService = require('../services/analyticsService');
const Event = require('../models/Event');

// GET /api/metrics
async function getMetrics(req, res) {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const metrics = await analyticsService.getMetrics(days);

    res.json(metrics);
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}

// POST /api/events - Track event from client
async function trackEvent(req, res) {
  try {
    const { eventType, campaignId, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    await Event.create({
      eventType,
      campaignId: campaignId || null,
      shareLinkId: null,
      metadata: metadata || {}
    });

    res.status(201).json({ message: 'Event tracked' });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
}

module.exports = {
  getMetrics,
  trackEvent
};
