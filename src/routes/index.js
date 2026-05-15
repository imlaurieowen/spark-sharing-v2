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
