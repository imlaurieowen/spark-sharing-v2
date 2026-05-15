const { sql } = require('../config/database');

async function create({ campaignId, label, copyText, displayOrder = 0 }) {
  const result = await sql`
    INSERT INTO campaign_copies (campaign_id, label, copy_text, display_order)
    VALUES (${campaignId}, ${label || null}, ${copyText}, ${displayOrder})
    RETURNING id, campaign_id, label, copy_text, display_order, created_at
  `;
  return result[0];
}

async function findByCampaignId(campaignId) {
  const result = await sql`
    SELECT id, campaign_id, label, copy_text, display_order, created_at
    FROM campaign_copies
    WHERE campaign_id = ${campaignId}
    ORDER BY display_order ASC, created_at ASC
  `;
  return result;
}

async function findById(id) {
  const result = await sql`
    SELECT id, campaign_id, label, copy_text, display_order, created_at
    FROM campaign_copies
    WHERE id = ${id}
  `;
  return result[0] || null;
}

async function update(id, { label, copyText }) {
  const result = await sql`
    UPDATE campaign_copies
    SET label = ${label || null}, copy_text = ${copyText}
    WHERE id = ${id}
    RETURNING id, campaign_id, label, copy_text, display_order, created_at
  `;
  return result[0] || null;
}

async function remove(id) {
  await sql`DELETE FROM campaign_copies WHERE id = ${id}`;
  return true;
}

async function removeByCampaignId(campaignId) {
  await sql`DELETE FROM campaign_copies WHERE campaign_id = ${campaignId}`;
  return true;
}

module.exports = {
  create,
  findByCampaignId,
  findById,
  update,
  remove,
  removeByCampaignId
};
