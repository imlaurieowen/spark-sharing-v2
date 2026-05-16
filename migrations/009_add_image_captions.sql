-- Add caption field to campaign_images
ALTER TABLE campaign_images ADD COLUMN IF NOT EXISTS caption VARCHAR(255);
