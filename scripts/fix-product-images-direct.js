import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function fixProductImages() {
  console.log('🚀 Fixing product images with service role...\n');

  try {
    // First, let's check what images we currently have
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, image_url, gallery_urls')
      .order('name');

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      return;
    }

    console.log('Current products:');
    products.forEach((p) => {
      console.log(`- ${p.name}: ${p.image_url}`);
    });

    // Update each product individually
    const updates = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Pineapple Fruz',
        image_url: '/assets/products/pineapple-fruz/pineapple-fruz-1.webp',
        gallery_urls: [
          '/assets/products/pineapple-fruz/pineapple-fruz-1.webp',
          '/assets/products/pineapple-fruz/pineapple-fruz-2.webp',
          '/assets/products/pineapple-fruz/pineapple-fruz-3.webp',
        ],
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Rainbow Sherbert #11',
        image_url: '/assets/products/rs11/rainbow-sherbert11-1.webp',
        gallery_urls: [
          '/assets/products/rs11/rainbow-sherbert11-1.webp',
          '/assets/products/rs11/rainbow-sherbert11-2.webp',
        ],
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Runtz',
        image_url: '/assets/products/runtz/runtz-1.webp',
        gallery_urls: [
          '/assets/products/runtz/runtz-1.webp',
          '/assets/products/runtz/runtz-2.webp',
          '/assets/products/runtz/runtz-3.webp',
        ],
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Wedding Cake',
        image_url: '/assets/products/wedding-cake/wedding-cake-1.webp',
        gallery_urls: [
          '/assets/products/wedding-cake/wedding-cake-1.webp',
          '/assets/products/wedding-cake/wedding-cake-2.webp',
          '/assets/products/wedding-cake/wedding-cake-3.webp',
        ],
      },
    ];

    console.log('\n🔄 Updating products to use WebP images...\n');

    for (const update of updates) {
      const { error } = await supabase
        .from('products')
        .update({
          image_url: update.image_url,
          gallery_urls: update.gallery_urls,
        })
        .eq('id', update.id);

      if (error) {
        console.error(`❌ Error updating ${update.name}:`, error);
      } else {
        console.log(`✅ Updated ${update.name}`);
      }
    }

    // Verify the updates
    console.log('\n📊 Verifying updates...\n');
    const { data: updatedProducts, error: verifyError } = await supabase
      .from('products')
      .select('id, name, image_url, gallery_urls')
      .order('name');

    if (verifyError) {
      console.error('Error verifying products:', verifyError);
    } else {
      updatedProducts.forEach((product) => {
        console.log(`📦 ${product.name}`);
        console.log(`   Main: ${product.image_url}`);
        if (product.gallery_urls) {
          console.log(`   Gallery: ${product.gallery_urls.join(', ')}`);
        }
        console.log('');
      });
    }

    console.log('✨ Update complete!');
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

fixProductImages();
