#!/usr/bin/env node

/**
 * Generate thumbnail images for all product images
 * Fixes Lighthouse "Properly size images" performance issue
 * Creates 128px and 160px variants for card/thumbnail display
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCT_DIR = path.join(__dirname, '..', 'public', 'assets', 'products');
const SIZES = [
  { name: 'thumb-128', size: 128 },
  { name: 'thumb-160', size: 160 },
];

async function checkImageMagick() {
  try {
    execSync('magick -version', { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync('convert -version', { stdio: 'ignore' });
      return true;
    } catch {
      console.error('❌ ImageMagick not found. Please install it:');
      console.error('  macOS: brew install imagemagick');
      console.error('  Ubuntu: sudo apt-get install imagemagick');
      console.error('  Windows: Download from https://imagemagick.org/');
      return false;
    }
  }
}

async function getProductImages() {
  const products = await fs.readdir(PRODUCT_DIR);
  const allImages = [];

  for (const product of products) {
    const productPath = path.join(PRODUCT_DIR, product);
    const stat = await fs.stat(productPath);

    if (stat.isDirectory()) {
      const files = await fs.readdir(productPath);
      const imageFiles = files.filter((file) => file.endsWith('.webp') && !file.includes('thumb-'));

      for (const imageFile of imageFiles) {
        allImages.push({
          product,
          file: imageFile,
          fullPath: path.join(productPath, imageFile),
        });
      }
    }
  }

  return allImages;
}

async function generateThumbnail(imagePath, outputPath, size) {
  const magickCommand = process.platform === 'win32' ? 'magick' : 'convert';

  try {
    // Use ImageMagick to resize with high quality
    const command = `${magickCommand} "${imagePath}" -resize ${size}x${size}^ -gravity center -extent ${size}x${size} -quality 85 -strip "${outputPath}"`;
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate thumbnail for ${imagePath}:`, error.message);
    return false;
  }
}

async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return Math.round(stats.size / 1024); // KB
  } catch {
    return 0;
  }
}

async function main() {
  console.log('🔍 Checking for ImageMagick...');

  if (!(await checkImageMagick())) {
    process.exit(1);
  }

  console.log('✅ ImageMagick found');
  console.log('📸 Scanning product images...');

  const images = await getProductImages();
  console.log(`Found ${images.length} product images`);

  let generated = 0;
  let skipped = 0;
  let totalSavings = 0;

  for (const image of images) {
    console.log(`\n📷 Processing ${image.product}/${image.file}`);

    const originalSize = await getFileSize(image.fullPath);
    console.log(`   Original: ${originalSize}KB`);

    for (const sizeConfig of SIZES) {
      const baseName = path.parse(image.file).name;
      const ext = path.parse(image.file).ext;
      const thumbFileName = `${baseName}-${sizeConfig.name}${ext}`;
      const thumbPath = path.join(path.dirname(image.fullPath), thumbFileName);

      // Check if thumbnail already exists
      try {
        await fs.access(thumbPath);
        const existingSize = await getFileSize(thumbPath);
        console.log(`   ${sizeConfig.name}: ${existingSize}KB (exists, skipping)`);
        skipped++;
        continue;
      } catch {
        // Thumbnail doesn't exist, create it
      }

      const success = await generateThumbnail(image.fullPath, thumbPath, sizeConfig.size);

      if (success) {
        const thumbSize = await getFileSize(thumbPath);
        const savings = originalSize - thumbSize;
        totalSavings += savings;

        console.log(`   ${sizeConfig.name}: ${thumbSize}KB (saved ${savings}KB)`);
        generated++;
      }
    }
  }

  console.log('\n🎉 Thumbnail generation complete!');
  console.log(`Generated: ${generated} thumbnails`);
  console.log(`Skipped: ${skipped} existing thumbnails`);
  console.log(`Total space savings: ${Math.round(totalSavings)}KB`);
  console.log('\n💡 Update your OptimizedProductImage component to use these thumbnails');
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
