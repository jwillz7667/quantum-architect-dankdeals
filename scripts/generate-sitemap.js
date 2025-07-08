// scripts/generate-sitemap.js
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'https://dankdealsmn.com';
const CURRENT_DATE = new Date().toISOString().split('T')[0];

// Optimized static pages with SEO-focused priorities
const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/categories', changefreq: 'daily', priority: 0.9 },
  { url: '/delivery-area', changefreq: 'weekly', priority: 0.8 },
  { url: '/blog', changefreq: 'weekly', priority: 0.8 },
  { url: '/faq', changefreq: 'monthly', priority: 0.7 },
  { url: '/about', changefreq: 'monthly', priority: 0.6 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  { url: '/legal', changefreq: 'yearly', priority: 0.5 },
  { url: '/privacy', changefreq: 'yearly', priority: 0.5 },
  { url: '/terms', changefreq: 'yearly', priority: 0.5 },
];

// Cannabis industry specific categories for better SEO
const productCategories = [
  'flower',
  'concentrates',
  'edibles',
  'pre-rolls',
  'vapes',
  'topicals',
  'accessories',
  'wellness',
];

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateForXml(date) {
  const d = new Date(date);
  return isNaN(d.getTime()) ? CURRENT_DATE : d.toISOString().split('T')[0];
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function generateSitemapHeader() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">`;
}

function generateUrlEntry(url, lastmod, changefreq, priority, images = []) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  if (!validateUrl(fullUrl)) return '';

  let entry = `
  <url>
    <loc>${escapeXml(fullUrl)}</loc>
    <lastmod>${formatDateForXml(lastmod)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <mobile:mobile/>`;

  // Add images if provided
  images.forEach((image) => {
    if (image.url && validateUrl(image.url)) {
      entry += `
    <image:image>
      <image:loc>${escapeXml(image.url)}</image:loc>
      <image:caption>${escapeXml(image.caption || 'Product Image')}</image:caption>
      <image:title>${escapeXml(image.title || image.caption || 'Product Image')}</image:title>
    </image:image>`;
    }
  });

  entry += `
  </url>`;
  return entry;
}

async function generateMainSitemap() {
  console.log('🚀 Generating main sitemap...');

  let sitemap = generateSitemapHeader();
  let totalUrls = 0;

  // Add static pages
  staticPages.forEach((page) => {
    const entry = generateUrlEntry(page.url, CURRENT_DATE, page.changefreq, page.priority);
    if (entry) {
      sitemap += entry;
      totalUrls++;
    }
  });

  // Add category pages
  productCategories.forEach((category) => {
    const entry = generateUrlEntry(`/categories/${category}`, CURRENT_DATE, 'weekly', 0.7);
    if (entry) {
      sitemap += entry;
      totalUrls++;
    }
  });

  sitemap += `
</urlset>`;

  writeFileSync(resolve(process.cwd(), 'public', 'sitemap.xml'), sitemap, 'utf8');
  console.log(`✅ Main sitemap generated with ${totalUrls} URLs`);

  return totalUrls;
}

async function generateProductSitemap() {
  if (!supabase) {
    console.log('⚠️ No database connection for product sitemap');
    return 0;
  }

  console.log('🛍️ Generating product sitemap...');

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, slug, updated_at, category')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!products?.length) return 0;

    let sitemap = generateSitemapHeader();
    let totalUrls = 0;

    products.forEach((product) => {
      const images = product.image_url
        ? [
            {
              url: product.image_url.startsWith('http')
                ? product.image_url
                : `${BASE_URL}${product.image_url}`,
              caption: product.name,
              title: product.name,
            },
          ]
        : [];

      const entry = generateUrlEntry(
        `/product/${product.slug || product.id}`,
        product.updated_at,
        'weekly',
        0.8,
        images
      );

      if (entry) {
        sitemap += entry;
        totalUrls++;
      }
    });

    // Add category pages
    const categories = [...new Set(products.map((p) => p.category))];
    categories.forEach((category) => {
      const entry = generateUrlEntry(
        `/categories?category=${encodeURIComponent(category)}`,
        CURRENT_DATE,
        'weekly',
        0.7
      );
      if (entry) {
        sitemap += entry;
        totalUrls++;
      }
    });

    sitemap += `
</urlset>`;

    writeFileSync(resolve(process.cwd(), 'public', 'sitemap-products.xml'), sitemap, 'utf8');
    console.log(`✅ Product sitemap generated with ${totalUrls} URLs`);

    return totalUrls;
  } catch (error) {
    console.warn('⚠️ Product sitemap generation failed:', error.message);
    return 0;
  }
}

async function generateBlogSitemap() {
  if (!supabase) return 0;

  console.log('📝 Generating blog sitemap...');

  try {
    // Check if blog_posts table exists before querying
    const { error: tableCheckError } = await supabase.from('blog_posts').select('id').limit(1);

    // If table doesn't exist, create empty sitemap
    if (
      tableCheckError &&
      tableCheckError.message.includes('relation "public.blog_posts" does not exist')
    ) {
      const emptySitemap = generateSitemapHeader() + '\n</urlset>';
      writeFileSync(resolve(process.cwd(), 'public', 'sitemap-blog.xml'), emptySitemap, 'utf8');
      console.log('✅ Blog sitemap created (no blog posts yet)');
      return 0;
    }

    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, updated_at, published_at, featured_image')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    if (!posts?.length) {
      const emptySitemap = generateSitemapHeader() + '\n</urlset>';
      writeFileSync(resolve(process.cwd(), 'public', 'sitemap-blog.xml'), emptySitemap, 'utf8');
      console.log('✅ Blog sitemap created (no blog posts yet)');
      return 0;
    }

    let sitemap = generateSitemapHeader();
    let totalUrls = 0;

    posts.forEach((post) => {
      const images = post.featured_image
        ? [
            {
              url: post.featured_image.startsWith('http')
                ? post.featured_image
                : `${BASE_URL}${post.featured_image}`,
              caption: post.title,
              title: post.title,
            },
          ]
        : [];

      const entry = generateUrlEntry(
        `/blog/${post.slug}`,
        post.updated_at || post.published_at,
        'monthly',
        0.6,
        images
      );

      if (entry) {
        sitemap += entry;
        totalUrls++;
      }
    });

    sitemap += `
</urlset>`;

    writeFileSync(resolve(process.cwd(), 'public', 'sitemap-blog.xml'), sitemap, 'utf8');
    console.log(`✅ Blog sitemap generated with ${totalUrls} URLs`);

    return totalUrls;
  } catch (error) {
    // Create empty sitemap on any error
    const emptySitemap = generateSitemapHeader() + '\n</urlset>';
    writeFileSync(resolve(process.cwd(), 'public', 'sitemap-blog.xml'), emptySitemap, 'utf8');
    console.log('✅ Blog sitemap created (blog feature not available)');
    return 0;
  }
}

async function generateSitemapIndex(totalUrls) {
  console.log('📑 Generating sitemap index...');

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap.xml</loc>
    <lastmod>${CURRENT_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-products.xml</loc>
    <lastmod>${CURRENT_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-blog.xml</loc>
    <lastmod>${CURRENT_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-images.xml</loc>
    <lastmod>${CURRENT_DATE}</lastmod>
  </sitemap>
</sitemapindex>`;

  writeFileSync(resolve(process.cwd(), 'public', 'sitemap-index.xml'), sitemapIndex, 'utf8');
  console.log('✅ Sitemap index created');
}

async function generateAllSitemaps() {
  try {
    console.log('🚀 Starting comprehensive sitemap generation...');
    console.log(`📅 Date: ${CURRENT_DATE}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);

    const mainUrls = await generateMainSitemap();
    const productUrls = await generateProductSitemap();
    const blogUrls = await generateBlogSitemap();
    const totalUrls = mainUrls + productUrls + blogUrls;

    // Generate sitemap index for better organization
    if (totalUrls > 50) {
      await generateSitemapIndex(totalUrls);
    }

    console.log('');
    console.log('✅ All sitemaps generated successfully!');
    console.log(`📊 Total URLs: ${totalUrls}`);
    console.log(`   📄 Main: ${mainUrls}`);
    console.log(`   🛍️ Products: ${productUrls}`);
    console.log(`   📝 Blog: ${blogUrls}`);
    console.log('');
    console.log('🔍 Google Search Console URLs:');
    console.log(`   ${BASE_URL}/sitemap.xml`);
    console.log(`   ${BASE_URL}/sitemap-products.xml`);
    console.log(`   ${BASE_URL}/sitemap-blog.xml`);
    console.log(`   ${BASE_URL}/sitemap-index.xml`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Submit all sitemaps to Google Search Console');
    console.log('   2. Test with Google Rich Results Test');
    console.log('   3. Monitor Core Web Vitals');
    console.log('   4. Check mobile usability');
    console.log('   5. Verify structured data markup');
  } catch (error) {
    console.error('❌ Error generating sitemaps:', error);

    // Create minimal fallback
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${CURRENT_DATE}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    writeFileSync(resolve(process.cwd(), 'public', 'sitemap.xml'), fallback, 'utf8');
    console.log('⚠️ Fallback sitemap created');
    process.exit(1);
  }
}

generateAllSitemaps();
