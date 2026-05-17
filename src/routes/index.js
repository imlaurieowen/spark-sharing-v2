const express = require('express');
const router = express.Router();

// Import route modules
const publicRoutes = require('./public');
const adminRoutes = require('./admin');
const shareRoutes = require('./share');
const authApiRoutes = require('./api/auth');
const campaignsApiRoutes = require('./api/campaigns');
const leadsApiRoutes = require('./api/leads');
const metricsApiRoutes = require('./api/metrics');

// Download proxy for R2 images (forces download)
router.get('/download', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl || !imageUrl.includes('r2.dev')) {
      return res.status(400).send('Invalid URL');
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(404).send('Image not found');
    }

    const filename = req.query.name || 'image.png';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png');

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Download proxy error:', err);
    res.status(500).send('Download failed');
  }
});

// Mount routes
router.use('/', publicRoutes);
router.use('/admin', adminRoutes);
router.use('/s', shareRoutes);

// API routes
router.use('/api/auth', authApiRoutes);
router.use('/api/campaigns', campaignsApiRoutes);
router.use('/api/leads', leadsApiRoutes);
router.use('/api', metricsApiRoutes);

module.exports = router;
