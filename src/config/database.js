const { neon, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const config = require('./env');

// Configure WebSocket for Node.js
neonConfig.webSocketConstructor = ws;

// Create a SQL query function using Neon serverless driver
const sql = neon(config.database.url);

// Helper function to run queries with error handling
async function query(text, params = []) {
  try {
    const result = await sql(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as now`;
    console.log('Database connected:', result[0].now);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

module.exports = {
  sql,
  query,
  testConnection
};
