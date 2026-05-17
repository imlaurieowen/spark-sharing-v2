const { body, validationResult } = require('express-validator');
const Campaign = require('../models/Campaign');
const CampaignImage = require('../models/CampaignImage');
const CampaignCopy = require('../models/CampaignCopy');
const uploadService = require('../services/uploadService');
const { slugify, generateUniqueSlug } = require('../utils/slugify');
const config = require('../config/env');

// Validation rules
const campaignValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required (max 255 characters)'),
  body('description')
    .optional()
    .trim()
];

// List campaigns for current user
async function list(req, res) {
  try {
    const campaigns = await Campaign.findByUserId(req.user.id);

    // Get image counts for each campaign
    const campaignsWithImages = await Promise.all(
      campaigns.map(async (campaign) => {
        const images = await CampaignImage.findByCampaignId(campaign.id);
        return {
          ...campaign,
          imageCount: images.length,
          firstImage: images[0]?.image_url || null
        };
      })
    );

    if (req.path.startsWith('/api')) {
      return res.json({ campaigns: campaignsWithImages });
    }

    res.render('admin/campaigns/index', {
      title: 'Campaigns',
      campaigns: campaignsWithImages,
      layout: 'layouts/main'
    });
  } catch (error) {
    console.error('List campaigns error:', error);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
    res.render('admin/campaigns/index', {
      title: 'Campaigns',
      campaigns: [],
      error: 'Failed to load campaigns',
      layout: 'layouts/main'
    });
  }
}

// Show create campaign form
async function createForm(req, res) {
  res.render('admin/campaigns/create', {
    title: 'Create Campaign',
    layout: 'layouts/main'
  });
}

// Create campaign
async function create(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.path.startsWith('/api')) {
        return res.status(400).json({ errors: errors.array() });
      }
      return res.render('admin/campaigns/create', {
        title: 'Create Campaign',
        errors: errors.array(),
        values: req.body,
        layout: 'layouts/main'
      });
    }

    const { title, description } = req.body;

    // Get copy options from form (arrays)
    const copyLabels = Array.isArray(req.body.copyLabel) ? req.body.copyLabel : [req.body.copyLabel].filter(Boolean);
    const copyTexts = Array.isArray(req.body.copyText) ? req.body.copyText : [req.body.copyText].filter(Boolean);

    // Validate at least one copy option
    if (copyTexts.length === 0 || !copyTexts.some(t => t && t.trim())) {
      const error = { msg: 'At least one copy option is required' };
      if (req.path.startsWith('/api')) {
        return res.status(400).json({ errors: [error] });
      }
      return res.render('admin/campaigns/create', {
        title: 'Create Campaign',
        errors: [error],
        values: req.body,
        layout: 'layouts/main'
      });
    }

    // Generate unique slug
    let slug = slugify(title);
    if (await Campaign.slugExists(slug)) {
      slug = generateUniqueSlug(slug);
    }

    // Create campaign (social_copy will store the first copy for backwards compat)
    const campaign = await Campaign.create({
      userId: req.user.id,
      title,
      slug,
      description: description || '',
      socialCopy: copyTexts[0] || ''
    });

    // Create copy options
    for (let i = 0; i < copyTexts.length; i++) {
      if (copyTexts[i] && copyTexts[i].trim()) {
        await CampaignCopy.create({
          campaignId: campaign.id,
          label: copyLabels[i] || `Option ${i + 1}`,
          copyText: copyTexts[i].trim(),
          displayOrder: i
        });
      }
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = await uploadService.uploadImage(file);
        // Use filename (without extension) as default caption
        const caption = file.originalname.replace(/\.[^/.]+$/, '');
        await CampaignImage.create({
          campaignId: campaign.id,
          imageUrl,
          displayOrder: i,
          caption
        });
      }
    }

    if (req.path.startsWith('/api')) {
      const images = await CampaignImage.findByCampaignId(campaign.id);
      const copies = await CampaignCopy.findByCampaignId(campaign.id);
      return res.status(201).json({
        message: 'Campaign created successfully',
        campaign: { ...campaign, images, copies }
      });
    }

    res.redirect(`/admin/campaigns/${campaign.id}`);
  } catch (error) {
    console.error('Create campaign error:', error);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({ error: 'Failed to create campaign' });
    }
    res.render('admin/campaigns/create', {
      title: 'Create Campaign',
      errors: [{ msg: 'Failed to create campaign. Please try again.' }],
      values: req.body,
      layout: 'layouts/main'
    });
  }
}

// Show single campaign
async function show(req, res) {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      return res.status(404).render('errors/404', {
        title: 'Campaign Not Found',
        layout: 'layouts/main'
      });
    }

    // Check ownership
    if (campaign.user_id !== req.user.id) {
      if (req.path.startsWith('/api')) {
        return res.status(403).json({ error: 'Access denied' });
      }
      return res.status(403).render('errors/404', {
        title: 'Access Denied',
        layout: 'layouts/main'
      });
    }

    const images = await CampaignImage.findByCampaignId(campaign.id);
    const copies = await CampaignCopy.findByCampaignId(campaign.id);
    const shareUrl = `${config.baseUrl}/s/campaign/${campaign.slug}`;

    if (req.path.startsWith('/api')) {
      return res.json({ campaign: { ...campaign, images, copies, shareUrl } });
    }

    res.render('admin/campaigns/show', {
      title: campaign.title,
      campaign,
      images,
      copies,
      shareUrl,
      layout: 'layouts/main'
    });
  } catch (error) {
    console.error('Show campaign error:', error);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({ error: 'Failed to fetch campaign' });
    }
    res.redirect('/admin/campaigns');
  }
}

// Show edit campaign form
async function editForm(req, res) {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign || campaign.user_id !== req.user.id) {
      return res.redirect('/admin/campaigns');
    }

    const images = await CampaignImage.findByCampaignId(campaign.id);
    const copies = await CampaignCopy.findByCampaignId(campaign.id);

    res.render('admin/campaigns/edit', {
      title: `Edit: ${campaign.title}`,
      campaign,
      images,
      copies,
      layout: 'layouts/main'
    });
  } catch (error) {
    console.error('Edit form error:', error);
    res.redirect('/admin/campaigns');
  }
}

// Update campaign
async function update(req, res) {
  try {
    const errors = validationResult(req);
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign || campaign.user_id !== req.user.id) {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      return res.redirect('/admin/campaigns');
    }

    if (!errors.isEmpty()) {
      if (req.path.startsWith('/api')) {
        return res.status(400).json({ errors: errors.array() });
      }
      const images = await CampaignImage.findByCampaignId(campaign.id);
      const copies = await CampaignCopy.findByCampaignId(campaign.id);
      return res.render('admin/campaigns/edit', {
        title: `Edit: ${campaign.title}`,
        campaign,
        images,
        copies,
        errors: errors.array(),
        layout: 'layouts/main'
      });
    }

    const { title, description } = req.body;
    let { slug } = req.body;

    // Handle slug - sanitize and validate uniqueness
    if (slug && slug.trim()) {
      slug = slugify(slug.trim());
    } else {
      slug = campaign.slug; // Keep existing slug if not provided
    }

    // Check if slug changed and if new slug is unique
    if (slug !== campaign.slug) {
      const slugTaken = await Campaign.slugExistsExcluding(slug, campaign.id);
      if (slugTaken) {
        const images = await CampaignImage.findByCampaignId(campaign.id);
        const copies = await CampaignCopy.findByCampaignId(campaign.id);
        if (req.path.startsWith('/api')) {
          return res.status(400).json({ error: 'That URL slug is already taken. Please choose another.' });
        }
        return res.render('admin/campaigns/edit', {
          title: `Edit: ${campaign.title}`,
          campaign,
          images,
          copies,
          errors: [{ msg: 'That URL slug is already taken. Please choose another.' }],
          layout: 'layouts/main'
        });
      }
    }

    // Get copy options from form
    const copyIds = Array.isArray(req.body.copyId) ? req.body.copyId : [req.body.copyId].filter(Boolean);
    const copyLabels = Array.isArray(req.body.copyLabel) ? req.body.copyLabel : [req.body.copyLabel].filter(Boolean);
    const copyTexts = Array.isArray(req.body.copyText) ? req.body.copyText : [req.body.copyText].filter(Boolean);

    // Update campaign
    const updated = await Campaign.update(campaign.id, {
      title,
      slug,
      description: description || '',
      socialCopy: copyTexts[0] || campaign.social_copy
    });

    // Delete existing copies and recreate
    await CampaignCopy.removeByCampaignId(campaign.id);

    for (let i = 0; i < copyTexts.length; i++) {
      if (copyTexts[i] && copyTexts[i].trim()) {
        await CampaignCopy.create({
          campaignId: campaign.id,
          label: copyLabels[i] || `Option ${i + 1}`,
          copyText: copyTexts[i].trim(),
          displayOrder: i
        });
      }
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const existingImages = await CampaignImage.findByCampaignId(campaign.id);
      const startOrder = existingImages.length;

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = await uploadService.uploadImage(file);
        // Use filename (without extension) as default caption
        const caption = file.originalname.replace(/\.[^/.]+$/, '');
        await CampaignImage.create({
          campaignId: campaign.id,
          imageUrl,
          displayOrder: startOrder + i,
          caption
        });
      }
    }

    if (req.path.startsWith('/api')) {
      const images = await CampaignImage.findByCampaignId(campaign.id);
      const copies = await CampaignCopy.findByCampaignId(campaign.id);
      return res.json({
        message: 'Campaign updated successfully',
        campaign: { ...updated, images, copies }
      });
    }

    res.redirect(`/admin/campaigns/${campaign.id}`);
  } catch (error) {
    console.error('Update campaign error:', error);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({ error: 'Failed to update campaign' });
    }
    res.redirect(`/admin/campaigns/${req.params.id}/edit`);
  }
}

// Delete campaign
async function remove(req, res) {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign || campaign.user_id !== req.user.id) {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      return res.redirect('/admin/campaigns');
    }

    // Delete images from storage
    const images = await CampaignImage.findByCampaignId(campaign.id);
    for (const image of images) {
      await uploadService.deleteImage(image.image_url);
    }

    // Delete campaign (cascades to images and copies in DB)
    await Campaign.remove(campaign.id);

    if (req.path.startsWith('/api')) {
      return res.json({ message: 'Campaign deleted successfully' });
    }

    res.redirect('/admin/campaigns');
  } catch (error) {
    console.error('Delete campaign error:', error);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({ error: 'Failed to delete campaign' });
    }
    res.redirect('/admin/campaigns');
  }
}

// Duplicate campaign
async function duplicate(req, res) {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign || campaign.user_id !== req.user.id) {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      return res.redirect('/admin/campaigns');
    }

    // Get original images and copies
    const images = await CampaignImage.findByCampaignId(campaign.id);
    const copies = await CampaignCopy.findByCampaignId(campaign.id);

    // Generate new unique slug
    let newSlug = slugify(campaign.title + ' Copy');
    if (await Campaign.slugExists(newSlug)) {
      newSlug = generateUniqueSlug(newSlug);
    }

    // Create new campaign
    const newCampaign = await Campaign.create({
      userId: req.user.id,
      title: campaign.title + ' (Copy)',
      slug: newSlug,
      description: campaign.description || '',
      socialCopy: campaign.social_copy || ''
    });

    // Duplicate copies
    for (const copy of copies) {
      await CampaignCopy.create({
        campaignId: newCampaign.id,
        label: copy.label,
        copyText: copy.copy_text,
        displayOrder: copy.display_order
      });
    }

    // Duplicate images (reference same URLs since they're in R2)
    for (const image of images) {
      await CampaignImage.create({
        campaignId: newCampaign.id,
        imageUrl: image.image_url,
        displayOrder: image.display_order,
        caption: image.caption
      });
    }

    if (req.path.startsWith('/api')) {
      return res.status(201).json({
        message: 'Campaign duplicated successfully',
        campaign: newCampaign
      });
    }

    res.redirect(`/admin/campaigns/${newCampaign.id}`);
  } catch (error) {
    console.error('Duplicate campaign error:', error);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({ error: 'Failed to duplicate campaign' });
    }
    res.redirect('/admin/campaigns');
  }
}

// Delete single image
async function removeImage(req, res) {
  try {
    const image = await CampaignImage.findById(req.params.imageId);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Verify campaign ownership
    const campaign = await Campaign.findById(image.campaign_id);
    if (!campaign || campaign.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete from storage
    await uploadService.deleteImage(image.image_url);

    // Delete from database
    await CampaignImage.remove(image.id);

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
}

// Update image caption
async function updateImageCaption(req, res) {
  try {
    const image = await CampaignImage.findById(req.params.imageId);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Verify campaign ownership
    const campaign = await Campaign.findById(image.campaign_id);
    if (!campaign || campaign.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { caption } = req.body;
    const updated = await CampaignImage.updateCaption(image.id, caption || null);

    res.json({ message: 'Caption updated successfully', image: updated });
  } catch (error) {
    console.error('Update caption error:', error);
    res.status(500).json({ error: 'Failed to update caption' });
  }
}

module.exports = {
  list,
  createForm,
  create,
  show,
  editForm,
  update,
  remove,
  removeImage,
  updateImageCaption,
  duplicate,
  campaignValidation
};
