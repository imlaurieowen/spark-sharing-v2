const { sql } = require('../config/database');

async function create({ eventType, campaignId, shareLinkId, metadata }) {
  const result = await sql`
    INSERT INTO events (event_type, campaign_id, share_link_id, metadata)
    VALUES (${eventType}, ${campaignId || null}, ${shareLinkId || null}, ${JSON.stringify(metadata || {})})
    RETURNING id, event_type, campaign_id, created_at
  `;
  return result[0];
}

async function countByType(eventType, days = 7) {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM events
    WHERE event_type = ${eventType}
    AND created_at > NOW() - INTERVAL '${days} days'
  `;
  return parseInt(result[0].count, 10);
}

async function countByCampaign(campaignId, days = 7) {
  const result = await sql`
    SELECT event_type, COUNT(*) as count
    FROM events
    WHERE campaign_id = ${campaignId}
    AND created_at > NOW() - INTERVAL '${days} days'
    GROUP BY event_type
  `;
  return result;
}

async function getEventsSummary(days = 7) {
  const result = await sql`
    SELECT event_type, COUNT(*) as count
    FROM events
    WHERE created_at > NOW() - INTERVAL '${days} days'
    GROUP BY event_type
    ORDER BY count DESC
  `;
  return result;
}

module.exports = {
  create,
  countByType,
  countByCampaign,
  getEventsSummary
};
