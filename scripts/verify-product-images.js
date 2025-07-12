// scripts/verify-product-images.js
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyProductImages() {
  console.log('🔍 Verifying product images...\n');

  try {
    // Fetch all products with their image URLs
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, image_url, gallery_urls');

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    let totalImages = 0;
    let missingImages = 0;
    let foundImages = 0;

    for (const product of products) {
      console.log(`\n📦 Product: ${product.name} (${product.id})`);

      // Check main image
      if (product.image_url) {
        totalImages++;
        const imagePath = path.join(process.cwd(), 'public', product.image_url);
        if (fs.existsSync(imagePath)) {
          console.log(`  ✅ Main image exists: ${product.image_url}`);
          foundImages++;
        } else {
          console.log(`  ❌ Main image missing: ${product.image_url}`);
          missingImages++;
        }
      }

      // Check gallery images
      if (product.gallery_urls && Array.isArray(product.gallery_urls)) {
        for (const galleryUrl of product.gallery_urls) {
          totalImages++;
          const imagePath = path.join(process.cwd(), 'public', galleryUrl);
          if (fs.existsSync(imagePath)) {
            console.log(`  ✅ Gallery image exists: ${galleryUrl}`);
            foundImages++;
          } else {
            console.log(`  ❌ Gallery image missing: ${galleryUrl}`);
            missingImages++;
          }
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Total images: ${totalImages}`);
    console.log(`  Found: ${foundImages}`);
    console.log(`  Missing: ${missingImages}`);

    if (missingImages > 0) {
      console.log('\n⚠️  Some images are missing from the public directory!');
      console.log('Make sure all product images are in the public/assets/products/ directory.');
    } else {
      console.log('\n✨ All product images are present!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyProductImages(); 