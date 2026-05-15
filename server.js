const app = require('./app');
const config = require('./src/config/env');
const { testConnection } = require('./src/config/database');

const PORT = config.port;

async function start() {
  // Test database connection
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on ${config.baseUrl}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}

start();
