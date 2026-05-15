const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../../middleware/auth');
const campaignController = require('../../controllers/campaignController');

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
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

// All routes require authentication
router.use(requireAuth);

// GET /api/campaigns - List campaigns
router.get('/', campaignController.list);

// POST /api/campaigns - Create campaign
router.post('/', upload.array('images', 10), campaignController.campaignValidation, campaignController.create);

// GET /api/campaigns/:id - Get single campaign
router.get('/:id', campaignController.show);

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', upload.array('images', 10), campaignController.campaignValidation, campaignController.update);

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', campaignController.remove);

// DELETE /api/campaigns/images/:imageId - Delete single image
router.delete('/images/:imageId', campaignController.removeImage);

module.exports = router;
