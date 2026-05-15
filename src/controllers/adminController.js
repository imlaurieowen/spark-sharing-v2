const Campaign = require('../models/Campaign');
const { sql } = require('../config/database');

// Dashboard with stats
async function dashboard(req, res) {
  try {
    // Get campaign count
    const campaignCount = await Campaign.countByUserId(req.user.id);

    // Get recent campaigns
    const campaigns = await Campaign.findByUserId(req.user.id);
    const recentCampaigns = campaigns.slice(0, 5);

    // Get page views for last 7 days (user's campaigns only)
    const pageViews = await sql`
      SELECT COUNT(*) as count
      FROM page_views
      WHERE path LIKE '/s/campaign/%'
      AND created_at > NOW() - INTERVAL '7 days'
    `;

    // Get share events for last 7 days
    const shareEvents = await sql`
      SELECT event_type, COUNT(*) as count
      FROM events
      WHERE event_type IN ('share_click_linkedin', 'share_click_twitter', 'copy_social_text')
      AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY event_type
    `;

    // Get leads count
    const leadsCount = await sql`
      SELECT COUNT(*) as count
      FROM leads
      WHERE created_at > NOW() - INTERVAL '7 days'
    `;

    const stats = {
      campaigns: campaignCount,
      pageViews: parseInt(pageViews[0]?.count || 0, 10),
      shares: shareEvents.reduce((sum, e) => sum + parseInt(e.count, 10), 0),
      leads: parseInt(leadsCount[0]?.count || 0, 10)
    };

    res.render('admin/dashboard', {
      title: 'Dashboard',
      user: req.user,
      stats,
      recentCampaigns,
      layout: 'layouts/main'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('admin/dashboard', {
      title: 'Dashboard',
      user: req.user,
      stats: { campaigns: 0, pageViews: 0, shares: 0, leads: 0 },
      recentCampaigns: [],
      error: 'Failed to load dashboard data',
      layout: 'layouts/main'
    });
  }
}

module.exports = {
  dashboard
};
