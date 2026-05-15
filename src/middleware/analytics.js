const analyticsService = require('../services/analyticsService');

function trackPageViews(req, res, next) {
  // Track asynchronously, don't wait for it
  setImmediate(() => {
    analyticsService.trackPageView(req);
  });
  next();
}

module.exports = {
  trackPageViews
};
