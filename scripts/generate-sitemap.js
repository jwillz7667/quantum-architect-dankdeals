// scripts/generate-sitemap.js
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  const { config } = await import('dotenv');
  config();
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'https://dankdealsmn.com';
const CURRENT_DATE = new Date().toISOString().split('T')[0];

// Static pages with SEO priorities (matching actual routes)
const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/categories', changefreq: 'daily', priority: 0.9 },
  { url: '/delivery-area', changefreq: 'weekly', priority: 0.8 },
  { url: '/delivery-areas', changefreq: 'weekly', priority: 0.8 },
  { url: '/blog', changefreq: 'weekly', priority: 0.8 },
  { url: '/faq', changefreq: 'monthly', priority: 0.7 },
  { url: '/cart', changefreq: 'never', priority: 0.3 },
  { url: '/legal', changefreq: 'yearly', priority: 0.4 },
  { url: '/privacy', changefreq: 'yearly', priority: 0.4 },
  { url: '/terms', changefreq: 'yearly', priority: 0.4 },
];

// Twin Cities suburbs for city-specific delivery pages
const cityPages = [
  'minneapolis',
  'st-paul',
  'bloomington',
  'plymouth',
  'maple-grove',
  'edina',
  'eden-prairie',
  'minnetonka',
  'burnsville',
  'woodbury',
  'lakeville',
  'blaine',
  'richfield',
  'roseville',
  'eagan',
  'coon-rapids',
  'apple-valley',
  'shakopee',
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

  // Add category pages (using query params to match actual routes)
  productCategories.forEach((category) => {
    const entry = generateUrlEntry(`/categories?category=${category}`, CURRENT_DATE, 'weekly', 0.7);
    if (entry) {
      sitemap += entry;
      totalUrls++;
    }
  });

  // Add city-specific delivery pages
  cityPages.forEach((city) => {
    const entry = generateUrlEntry(`/delivery/${city}`, CURRENT_DATE, 'weekly', 0.8, [
      {
        url: `${BASE_URL}/cannabis-delivery-${city}.jpg`,
        caption: `Cannabis delivery service in ${city.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`,
        title: `${city.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Cannabis Delivery`,
      },
    ]);
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
      .select('id, name, image_url, updated_at, category')
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
        `/product/${product.id}`, // Use ID to match actual routes
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
  console.log('📝 Generating blog sitemap...');

  try {
    // Hardcoded blog posts from Blog.tsx component
    const blogPosts = [
      {
        slug: 'understanding-terpenes-cannabis-flavor-effects',
        title: 'Understanding Terpenes: The Secret Behind Cannabis Flavor and Effects',
        date: '2025-01-08',
        priority: 0.7,
      },
      {
        slug: 'cannabis-edibles-dosing-guide-beginners',
        title: 'The Complete Guide to Cannabis Edibles Dosing for Beginners',
        date: '2025-01-06',
        priority: 0.7,
      },
      {
        slug: 'minnesota-cannabis-laws-2025',
        title: 'Minnesota Cannabis Laws 2025: What You Need to Know',
        date: '2025-01-05',
        priority: 0.7,
      },
      {
        slug: 'best-cannabis-strains-winter-2025',
        title: 'Top 5 Cannabis Strains for Minnesota Winter 2025',
        date: '2025-01-03',
        priority: 0.7,
      },
      {
        slug: 'dankdeals-vs-dank-district-minneapolis-cannabis-delivery',
        title: 'Minneapolis Cannabis Delivery Showdown: Why DankDeals Outshines Dank District',
        date: '2025-01-18',
        priority: 0.9,
        isNews: true,
        keywords:
          'dank district, minneapolis cannabis delivery, cannabis delivery comparison, dankdeals vs dank district',
      },
      {
        slug: 'fastest-weed-delivery-minneapolis-st-paul',
        title: 'The Fastest Weed Delivery in Minneapolis-St. Paul: Beyond Dank District',
        date: '2025-01-17',
        priority: 0.9,
        isNews: true,
        keywords:
          'fast weed delivery minneapolis, dank district delivery times, cannabis delivery st paul, fastest cannabis delivery',
      },
      {
        slug: 'minneapolis-cannabis-delivery-zones-coverage',
        title: 'Complete Minneapolis Cannabis Delivery Guide: Every Neighborhood Covered',
        date: '2025-01-16',
        priority: 0.9,
        isNews: true,
        keywords:
          'cannabis delivery zones minneapolis, dank district coverage, st paul weed delivery, cannabis delivery neighborhoods',
      },
    ];

    let sitemap = generateSitemapHeader();
    let totalUrls = 0;

    // Add blog index
    const blogIndexEntry = generateUrlEntry('/blog', CURRENT_DATE, 'weekly', 0.8);
    sitemap += blogIndexEntry;
    totalUrls++;

    // Add individual blog posts
    blogPosts.forEach((post) => {
      let entry = `
  <url>
    <loc>${escapeXml(`${BASE_URL}/blog/${post.slug}`)}</loc>
    <lastmod>${formatDateForXml(post.date)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${post.priority}</priority>`;

      if (post.isNews) {
        entry += `
    <news:news>
      <news:publication>
        <news:name>DankDeals Blog</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${formatDateForXml(post.date)}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
      <news:keywords>${escapeXml(post.keywords || '')}</news:keywords>
    </news:news>`;
      }

      entry += `
    <mobile:mobile/>
  </url>`;

      sitemap += entry;
      totalUrls++;
    });

    sitemap += '\n</urlset>';
    writeFileSync(resolve(process.cwd(), 'public', 'sitemap-blog.xml'), sitemap, 'utf8');
    console.log(`✅ Blog sitemap generated with ${totalUrls} URLs`);
    return totalUrls;
  } catch (error) {
    console.warn('⚠️ Blog sitemap generation failed:', error.message);
    // Create sitemap with blog index on any error
    let sitemap = generateSitemapHeader();
    const blogIndexEntry = generateUrlEntry('/blog', CURRENT_DATE, 'weekly', 0.8);
    sitemap += blogIndexEntry;
    sitemap += '\n</urlset>';
    writeFileSync(resolve(process.cwd(), 'public', 'sitemap-blog.xml'), sitemap, 'utf8');
    console.log('✅ Blog sitemap created (fallback mode)');
    return 1;
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
