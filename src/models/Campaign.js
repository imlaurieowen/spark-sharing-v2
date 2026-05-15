const { sql } = require('../config/database');

async function create({ userId, title, slug, description, socialCopy }) {
  const result = await sql`
    INSERT INTO campaigns (user_id, title, slug, description, social_copy)
    VALUES (${userId}, ${title}, ${slug}, ${description}, ${socialCopy})
    RETURNING id, user_id, title, slug, description, social_copy, created_at
  `;
  return result[0];
}

async function findById(id) {
  const result = await sql`
    SELECT id, user_id, title, slug, description, social_copy, created_at
    FROM campaigns
    WHERE id = ${id}
  `;
  return result[0] || null;
}

async function findBySlug(slug) {
  const result = await sql`
    SELECT id, user_id, title, slug, description, social_copy, created_at
    FROM campaigns
    WHERE slug = ${slug}
  `;
  return result[0] || null;
}

async function findByUserId(userId) {
  const result = await sql`
    SELECT id, user_id, title, slug, description, social_copy, created_at
    FROM campaigns
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return result;
}

async function update(id, { title, slug, description, socialCopy }) {
  const result = await sql`
    UPDATE campaigns
    SET title = ${title}, slug = ${slug}, description = ${description}, social_copy = ${socialCopy}
    WHERE id = ${id}
    RETURNING id, user_id, title, slug, description, social_copy, created_at
  `;
  return result[0] || null;
}

async function remove(id) {
  await sql`DELETE FROM campaigns WHERE id = ${id}`;
  return true;
}

async function slugExists(slug) {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM campaigns
    WHERE slug = ${slug}
  `;
  return parseInt(result[0].count, 10) > 0;
}

async function slugExistsExcluding(slug, excludeId) {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM campaigns
    WHERE slug = ${slug} AND id != ${excludeId}
  `;
  return parseInt(result[0].count, 10) > 0;
}

async function countByUserId(userId) {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM campaigns
    WHERE user_id = ${userId}
  `;
  return parseInt(result[0].count, 10);
}

module.exports = {
  create,
  findById,
  findBySlug,
  findByUserId,
  update,
  remove,
  slugExists,
  slugExistsExcluding,
  countByUserId
};
