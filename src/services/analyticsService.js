const PageView = require('../models/PageView');
const Event = require('../models/Event');

async function trackPageView(req) {
  try {
    // Skip static files and API routes (except share tracking)
    const path = req.path;
    if (path.startsWith('/css') || path.startsWith('/js') || path.startsWith('/images') ||
        path.startsWith('/api') || path === '/health' || path === '/favicon.ico') {
      return;
    }

    await PageView.create({
      path,
      referrer: req.get('referrer') || null,
      userAgent: req.get('user-agent') || null,
      ipAddress: req.ip || req.connection.remoteAddress
    });
  } catch (error) {
    console.error('Failed to track page view:', error.message);
  }
}

async function trackEvent(eventType, campaignId = null, shareLinkId = null, metadata = {}) {
  try {
    await Event.create({
      eventType,
      campaignId,
      shareLinkId,
      metadata
    });
  } catch (error) {
    console.error('Failed to track event:', error.message);
  }
}

async function getMetrics(days = 7) {
  const [pageViews, uniqueVisitors, topPages, events] = await Promise.all([
    PageView.countTotal(days),
    PageView.countUnique(days),
    PageView.getTopPages(days),
    Event.getEventsSummary(days)
  ]);

  return {
    pageViews,
    uniqueVisitors,
    topPages,
    events: events.reduce((acc, e) => {
      acc[e.event_type] = parseInt(e.count, 10);
      return acc;
    }, {})
  };
}

module.exports = {
  trackPageView,
  trackEvent,
  getMetrics
};
