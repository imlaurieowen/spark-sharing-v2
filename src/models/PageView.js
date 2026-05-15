const { sql } = require('../config/database');

async function create({ path, referrer, userAgent, ipAddress }) {
  const result = await sql`
    INSERT INTO page_views (path, referrer, user_agent, ip_address)
    VALUES (${path}, ${referrer}, ${userAgent}, ${ipAddress})
    RETURNING id, path, created_at
  `;
  return result[0];
}

async function countByPath(path, days = 7) {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM page_views
    WHERE path = ${path}
    AND created_at > NOW() - INTERVAL '${days} days'
  `;
  return parseInt(result[0].count, 10);
}

async function countTotal(days = 7) {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM page_views
    WHERE created_at > NOW() - INTERVAL '${days} days'
  `;
  return parseInt(result[0].count, 10);
}

async function countUnique(days = 7) {
  const result = await sql`
    SELECT COUNT(DISTINCT ip_address) as count
    FROM page_views
    WHERE created_at > NOW() - INTERVAL '${days} days'
  `;
  return parseInt(result[0].count, 10);
}

async function getTopPages(days = 7, limit = 10) {
  const result = await sql`
    SELECT path, COUNT(*) as views
    FROM page_views
    WHERE created_at > NOW() - INTERVAL '${days} days'
    GROUP BY path
    ORDER BY views DESC
    LIMIT ${limit}
  `;
  return result;
}

module.exports = {
  create,
  countByPath,
  countTotal,
  countUnique,
  getTopPages
};
