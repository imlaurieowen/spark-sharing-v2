const { sql } = require('../config/database');

async function create({ email, source }) {
  const result = await sql`
    INSERT INTO leads (email, source)
    VALUES (${email}, ${source})
    RETURNING id, email, source, created_at
  `;
  return result[0];
}

async function findByEmail(email) {
  const result = await sql`
    SELECT id, email, source, created_at
    FROM leads
    WHERE email = ${email}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return result[0] || null;
}

async function count() {
  const result = await sql`
    SELECT COUNT(*) as count FROM leads
  `;
  return parseInt(result[0].count, 10);
}

async function countRecent(days = 7) {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM leads
    WHERE created_at > NOW() - INTERVAL '${days} days'
  `;
  return parseInt(result[0].count, 10);
}

async function findAll(limit = 100, offset = 0) {
  const result = await sql`
    SELECT id, email, source, created_at
    FROM leads
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return result;
}

module.exports = {
  create,
  findByEmail,
  count,
  countRecent,
  findAll
};
