const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');

// GET /s/campaign/:slug - Public share page by campaign slug
router.get('/campaign/:slug', shareController.showBySlug);

// GET /s/:token - Legacy share link by token
router.get('/:token', shareController.showByToken);

module.exports = router;
