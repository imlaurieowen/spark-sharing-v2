const Campaign = require('../models/Campaign');
const CampaignImage = require('../models/CampaignImage');
const CampaignCopy = require('../models/CampaignCopy');
const config = require('../config/env');

// Public share page by slug
async function showBySlug(req, res) {
  try {
    const campaign = await Campaign.findBySlug(req.params.slug);

    if (!campaign) {
      return res.status(404).render('errors/404', {
        title: 'Campaign Not Found',
        layout: 'layouts/main'
      });
    }

    const images = await CampaignImage.findByCampaignId(campaign.id);
    const copies = await CampaignCopy.findByCampaignId(campaign.id);
    const shareUrl = `${config.baseUrl}/s/campaign/${campaign.slug}`;

    // Get first image for OG tags
    const ogImage = images.length > 0 ? images[0].image_url : null;

    // Use first copy option for OG description, fallback to social_copy
    const defaultCopy = copies.length > 0 ? copies[0].copy_text : campaign.social_copy;

    res.render('share/campaign', {
      title: campaign.title,
      campaign,
      images,
      copies,
      shareUrl,
      layout: false
    });
  } catch (error) {
    console.error('Share page error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main'
    });
  }
}

// Legacy share link by token (redirect to campaign)
async function showByToken(req, res) {
  try {
    const { sql } = require('../config/database');

    const result = await sql`
      SELECT c.slug
      FROM share_links sl
      JOIN campaigns c ON sl.campaign_id = c.id
      WHERE sl.token = ${req.params.token}
    `;

    if (result.length === 0) {
      return res.status(404).render('errors/404', {
        title: 'Link Not Found',
        layout: 'layouts/main'
      });
    }

    res.redirect(`/s/campaign/${result[0].slug}`);
  } catch (error) {
    console.error('Legacy share link error:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      layout: 'layouts/main'
    });
  }
}

module.exports = {
  showBySlug,
  showByToken
};
