const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const seoService = require('../services/seoService');
const Campaign = require('../models/Campaign');
const config = require('../config/env');

// Landing page
router.get('/', optionalAuth, (req, res) => {
  const jsonLd = [
    seoService.generateJsonLd('Organization'),
    seoService.generateJsonLd('WebSite')
  ];

  res.render('public/landing', {
    title: 'Amplify Your Message with Coordinated Sharing',
    metaTags: {
      description: 'Create campaigns with images and pre-written copy. Share one link. Everyone posts in seconds. The easiest way to coordinate social sharing.',
      ogTitle: 'Spark Sharing - Coordinated Social Amplification',
      ogDescription: 'Create campaigns with images and pre-written copy. Share one link. Everyone posts in seconds.',
      ogUrl: config.baseUrl,
      ogType: 'website',
      twitterCard: 'summary_large_image'
    },
    jsonLd: JSON.stringify(jsonLd),
    layout: 'layouts/main'
  });
});

// Sitemap
router.get('/sitemap.xml', async (req, res) => {
  try {
    // Get all campaigns for sitemap
    const { sql } = require('../config/database');
    const campaigns = await sql`
      SELECT slug, created_at FROM campaigns ORDER BY created_at DESC
    `;

    const urls = [
      { loc: config.baseUrl, priority: '1.0', changefreq: 'weekly' }
    ];

    campaigns.forEach(campaign => {
      urls.push({
        loc: `${config.baseUrl}/s/campaign/${campaign.slug}`,
        lastmod: new Date(campaign.created_at).toISOString().split('T')[0],
        priority: '0.8',
        changefreq: 'monthly'
      });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Robots.txt
router.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${config.baseUrl}/sitemap.xml`;

  res.set('Content-Type', 'text/plain');
  res.send(robots);
});

module.exports = router;
