const { sql } = require('../config/database');

async function create({ campaignId, imageUrl, displayOrder = 0 }) {
  const result = await sql`
    INSERT INTO campaign_images (campaign_id, image_url, display_order)
    VALUES (${campaignId}, ${imageUrl}, ${displayOrder})
    RETURNING id, campaign_id, image_url, display_order, created_at
  `;
  return result[0];
}

async function findByCampaignId(campaignId) {
  const result = await sql`
    SELECT id, campaign_id, image_url, display_order, created_at
    FROM campaign_images
    WHERE campaign_id = ${campaignId}
    ORDER BY display_order ASC, created_at ASC
  `;
  return result;
}

async function findById(id) {
  const result = await sql`
    SELECT id, campaign_id, image_url, display_order, created_at
    FROM campaign_images
    WHERE id = ${id}
  `;
  return result[0] || null;
}

async function remove(id) {
  const result = await sql`
    DELETE FROM campaign_images
    WHERE id = ${id}
    RETURNING image_url
  `;
  return result[0] || null;
}

async function removeByCampaignId(campaignId) {
  const result = await sql`
    DELETE FROM campaign_images
    WHERE campaign_id = ${campaignId}
    RETURNING image_url
  `;
  return result;
}

async function updateOrder(id, displayOrder) {
  const result = await sql`
    UPDATE campaign_images
    SET display_order = ${displayOrder}
    WHERE id = ${id}
    RETURNING id, campaign_id, image_url, display_order, created_at
  `;
  return result[0] || null;
}

module.exports = {
  create,
  findByCampaignId,
  findById,
  remove,
  removeByCampaignId,
  updateOrder
};
