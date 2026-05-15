const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const campaignController = require('../controllers/campaignController');

// Configure multer for memory storage (we'll upload to R2)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Method override for PUT/DELETE from forms
router.use((req, res, next) => {
  if (req.query._method) {
    req.method = req.query._method.toUpperCase();
  }
  next();
});

// Public auth routes
router.get('/login', (req, res) => {
  if (req.cookies.token) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { title: 'Login', layout: 'layouts/main' });
});

router.post('/login', authController.loginValidation, authController.login);

router.get('/register', (req, res) => {
  if (req.cookies.token) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/register', { title: 'Register', layout: 'layouts/main' });
});

router.post('/register', authController.registerValidation, authController.register);

router.get('/logout', authController.logout);

// Protected routes - require authentication
router.use(requireAuth);

// Dashboard
router.get('/', (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', adminController.dashboard);

// Campaigns
router.get('/campaigns', campaignController.list);
router.get('/campaigns/new', campaignController.createForm);
router.post('/campaigns', upload.array('images', 10), campaignController.campaignValidation, campaignController.create);
router.get('/campaigns/:id', campaignController.show);
router.get('/campaigns/:id/edit', campaignController.editForm);
router.put('/campaigns/:id', upload.array('images', 10), campaignController.campaignValidation, campaignController.update);
router.delete('/campaigns/:id', campaignController.remove);

module.exports = router;
