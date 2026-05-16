const app = require('./app');
const config = require('./src/config/env');
const { testConnection } = require('./src/config/database');

const PORT = config.port;

// Prevent crashes from unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  // Don't exit - try to keep serving
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit - try to keep serving
});

async function start() {
  // Test database connection with retry
  let dbConnected = false;
  let retries = 3;

  while (!dbConnected && retries > 0) {
    dbConnected = await testConnection();
    if (!dbConnected) {
      console.log(`Database connection failed, retrying... (${retries} attempts left)`);
      retries--;
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  if (!dbConnected) {
    console.error('Failed to connect to database after retries. Starting anyway...');
    // Start anyway - health check will fail but at least we're running
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on ${config.baseUrl}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error('Server error:', err.message);
  });
}

start();
