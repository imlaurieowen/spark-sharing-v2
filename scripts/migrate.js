#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure WebSocket for Node.js
neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function runMigrations() {
  console.log('Starting migrations...\n');

  const client = await pool.connect();

  try {
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of already executed migrations
    const executed = await client.query('SELECT name FROM _migrations ORDER BY id');
    const executedNames = new Set(executed.rows.map(row => row.name));

    // Get all migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    let migrationsRun = 0;

    for (const file of files) {
      if (executedNames.has(file)) {
        console.log(`  [SKIP] ${file} (already executed)`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      console.log(`  [RUN]  ${file}`);

      try {
        // Execute migration
        await client.query(sqlContent);

        // Record migration as executed
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);

        console.log(`         Done!`);
        migrationsRun++;
      } catch (error) {
        console.error(`  [FAIL] ${file}`);
        console.error(`         ${error.message}`);
        process.exit(1);
      }
    }

    console.log(`\nMigrations complete. ${migrationsRun} migration(s) executed.`);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
