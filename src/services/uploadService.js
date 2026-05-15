const { s3Client, PutObjectCommand, DeleteObjectCommand, bucketName, publicUrl, isConfigured } = require('../config/r2');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// For local development fallback
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function uploadImage(file) {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const fileName = `${crypto.randomUUID()}${fileExtension}`;

  // Use R2 if configured, otherwise fall back to local storage
  if (isConfigured()) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype
      });

      await s3Client.send(command);

      return `${publicUrl}/${fileName}`;
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error('Failed to upload image');
    }
  } else {
    // Local storage fallback
    const filePath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(filePath, file.buffer);
    return `/uploads/${fileName}`;
  }
}

async function deleteImage(imageUrl) {
  // Check if it's an R2 URL or local
  if (imageUrl.includes('.r2.dev') || imageUrl.includes('r2.cloudflarestorage.com')) {
    if (!isConfigured()) {
      console.warn('R2 not configured, cannot delete remote image');
      return;
    }

    try {
      const fileName = imageUrl.split('/').pop();
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('R2 delete error:', error);
    }
  } else if (imageUrl.startsWith('/uploads/')) {
    // Local file
    const fileName = imageUrl.replace('/uploads/', '');
    const filePath = path.join(UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = {
  uploadImage,
  deleteImage
};
