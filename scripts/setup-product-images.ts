import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client with service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Product image mappings
const productImages = [
  {
    productId: '11111111-1111-1111-1111-111111111111',
    name: 'pineapple-fruz',
    images: [
      'pineapple-fruz/pineapple-fruz-1.webp',
      'pineapple-fruz/pineapple-fruz-2.webp',
      'pineapple-fruz/pineapple-fruz-3.webp',
    ],
  },
  {
    productId: '22222222-2222-2222-2222-222222222222',
    name: 'rs11',
    images: ['rs11/rainbow-sherbert11-1.webp', 'rs11/rainbow-sherbert11-2.webp'],
  },
  {
    productId: '33333333-3333-3333-3333-333333333333',
    name: 'runtz',
    images: ['runtz/runtz-1.webp', 'runtz/runtz-2.webp', 'runtz/runtz-3.webp'],
  },
  {
    productId: '44444444-4444-4444-4444-444444444444',
    name: 'wedding-cake',
    images: [
      'wedding-cake/wedding-cake-1.webp',
      'wedding-cake/wedding-cake-2.webp',
      'wedding-cake/wedding-cake-3.webp',
    ],
  },
];

async function setupProductImages() {
  console.log('🚀 Setting up product images in Supabase Storage...');

  try {
    // Step 1: Create products bucket if it doesn't exist
    console.log('📦 Creating products storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`);
    }

    const productsBucketExists = buckets?.some((bucket) => bucket.name === 'products');

    if (!productsBucketExists) {
      const { error: createError } = await supabase.storage.createBucket('products', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png', 'image/jpg'],
      });

      if (createError) {
        throw new Error(`Failed to create products bucket: ${createError.message}`);
      }
      console.log('✅ Products bucket created successfully');
    } else {
      console.log('✅ Products bucket already exists');
    }

    // Step 2: Upload images
    console.log('📤 Uploading product images...');
    const uploadedUrls: Record<string, { imageUrl: string; galleryUrls: string[] }> = {};

    for (const product of productImages) {
      console.log(`\n📸 Processing ${product.name}...`);
      const galleryUrls: string[] = [];

      for (const imagePath of product.images) {
        const localPath = path.join(__dirname, '..', 'src', 'assets', 'products', imagePath);

        if (!fs.existsSync(localPath)) {
          console.warn(`⚠️  Image not found: ${localPath}`);
          continue;
        }

        const fileBuffer = fs.readFileSync(localPath);
        const fileName = `${product.productId}/${path.basename(imagePath)}`;

        // Check if file already exists
        const { data: existingFile } = await supabase.storage
          .from('products')
          .list(product.productId);
        const fileExists = existingFile?.some((file) => file.name === path.basename(imagePath));

        if (fileExists) {
          console.log(`   ✓ ${imagePath} already exists`);
        } else {
          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, fileBuffer, {
              contentType: 'image/webp',
              upsert: true,
            });

          if (uploadError) {
            console.error(`   ✗ Failed to upload ${imagePath}: ${uploadError.message}`);
            continue;
          }
          console.log(`   ✓ Uploaded ${imagePath}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
        galleryUrls.push(urlData.publicUrl);
      }

      uploadedUrls[product.productId] = {
        imageUrl: galleryUrls[0] || '',
        galleryUrls,
      };
    }

    // Step 3: Update database with new URLs
    console.log('\n📝 Updating database with Supabase Storage URLs...');

    for (const [productId, urls] of Object.entries(uploadedUrls)) {
      if (!urls.imageUrl) continue;

      const { error: updateError } = await supabase
        .from('products')
        .update({
          image_url: urls.imageUrl,
          gallery_urls: urls.galleryUrls,
        })
        .eq('id', productId);

      if (updateError) {
        console.error(`❌ Failed to update product ${productId}: ${updateError.message}`);
      } else {
        console.log(`✅ Updated product ${productId}`);
      }
    }

    console.log('\n🎉 Product images setup completed successfully!');
    console.log('📌 Images are now served from Supabase Storage');
    console.log('🌐 Public access is enabled for the products bucket');
  } catch (error) {
    console.error('❌ Error setting up product images:', error);
    process.exit(1);
  }
}

// Run the setup
setupProductImages();
