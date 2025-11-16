import fs from 'fs';
import path from 'path';

/**
 * Ensures that required directories exist
 * Creates them if they don't exist
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📁 Created directory: ${dirPath}`);
    }
  }
}

/**
 * Initialize all required directories for the application
 */
function initializeDirectories(): void {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const attachmentsDir = path.join(uploadsDir, 'attachments');

  ensureDirectoryExists(uploadsDir);
  ensureDirectoryExists(attachmentsDir);

  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ All required directories initialized');
  }
}

// CommonJS exports
module.exports = {
  ensureDirectoryExists,
  initializeDirectories,
};
