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

async function setupLogoStorage() {
  console.log('🚀 Setting up logo in Supabase Storage...');

  try {
    // Step 1: Create logos bucket if it doesn't exist
    console.log('📦 Creating logos storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`);
    }

    const logosBucketExists = buckets?.some((bucket) => bucket.name === 'logos');

    if (!logosBucketExists) {
      const { error: createError } = await supabase.storage.createBucket('logos', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'],
      });

      if (createError) {
        throw new Error(`Failed to create logos bucket: ${createError.message}`);
      }
      console.log('✅ Logos bucket created successfully');
    } else {
      console.log('✅ Logos bucket already exists');
    }

    // Step 2: Upload logo
    console.log('📤 Uploading logo...');

    const logoPath = path.join(__dirname, '..', 'public', 'logos', 'white-logo-trans.webp');
    const fileName = 'white-logo-trans.webp';

    if (!fs.existsSync(logoPath)) {
      throw new Error(`Logo file not found: ${logoPath}`);
    }

    const fileBuffer = fs.readFileSync(logoPath);

    // Check if file already exists
    const { data: existingFile } = await supabase.storage
      .from('logos')
      .list('', { search: fileName });

    const fileExists = existingFile?.some((file) => file.name === fileName);

    if (fileExists) {
      // Remove existing file first
      console.log('📝 Logo already exists, updating...');
      const { error: removeError } = await supabase.storage.from('logos').remove([fileName]);

      if (removeError) {
        console.warn(`⚠️  Could not remove existing file: ${removeError.message}`);
      }
    }

    // Upload the logo
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, fileBuffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);

    console.log('\n✅ Logo uploaded successfully!');
    console.log('📌 Public URL:', urlData.publicUrl);
    console.log('\n🎉 Logo setup completed successfully!');
    console.log('🌐 Public access is enabled for the logos bucket');

    // Display usage instructions
    console.log('\n📚 Usage Instructions:');
    console.log('1. You can access the logo using the public URL above');
    console.log('2. In your React components, use:');
    console.log(
      `   const logoUrl = supabase.storage.from('logos').getPublicUrl('white-logo-trans.webp').data.publicUrl;`
    );
    console.log('3. Or directly use the URL in your components');
  } catch (error) {
    console.error('❌ Error setting up logo:', error);
    process.exit(1);
  }
}

// Run the setup
setupLogoStorage();
