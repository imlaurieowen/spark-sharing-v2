const { sql } = require('../config/database');

async function create({ email, passwordHash, name }) {
  const result = await sql`
    INSERT INTO users (email, password_hash, name)
    VALUES (${email}, ${passwordHash}, ${name})
    RETURNING id, email, name, created_at
  `;
  return result[0];
}

async function findByEmail(email) {
  const result = await sql`
    SELECT id, email, password_hash, name, created_at
    FROM users
    WHERE email = ${email}
  `;
  return result[0] || null;
}

async function findById(id) {
  const result = await sql`
    SELECT id, email, name, created_at
    FROM users
    WHERE id = ${id}
  `;
  return result[0] || null;
}

async function emailExists(email) {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM users
    WHERE email = ${email}
  `;
  return parseInt(result[0].count, 10) > 0;
}

module.exports = {
  create,
  findByEmail,
  findById,
  emailExists
};
