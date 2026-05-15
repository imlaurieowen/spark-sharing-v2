const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const config = require('./env');

// Create S3 client configured for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey
  }
});

// Check if R2 is configured
function isConfigured() {
  return !!(config.r2.accountId && config.r2.accessKeyId && config.r2.secretAccessKey);
}

module.exports = {
  s3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  bucketName: config.r2.bucketName,
  publicUrl: config.r2.publicUrl,
  isConfigured
};
