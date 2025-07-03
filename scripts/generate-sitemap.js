// scripts/generate-sitemap.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ralbzuvkyexortqngvxs.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Comprehensive static pages with proper SEO priorities
const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/categories', changefreq: 'daily', priority: 0.9 },
  { url: '/delivery-area', changefreq: 'weekly', priority: 0.8 },
  { url: '/faq', changefreq: 'monthly', priority: 0.7 },
  { url: '/blog', changefreq: 'weekly', priority: 0.8 },
  { url: '/legal', changefreq: 'yearly', priority: 0.5 },
  { url: '/privacy', changefreq: 'yearly', priority: 0.5 },
  { url: '/terms', changefreq: 'yearly', priority: 0.5 },
  { url: '/auth', changefreq: 'monthly', priority: 0.4 },
];

// Product categories for better organization
const productCategories = [
  'flower',
  'edibles', 
  'concentrates',
  'vape',
  'pre-rolls',
  'accessories',
  'topicals'
];

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateForXml(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return d.toISOString().split('T')[0];
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function generateSitemap() {
  try {
    console.log('🚀 Generating comprehensive sitemap...');
    
    const baseUrl = 'https://dankdealsmn.com';
    const currentDate = formatDateForXml(new Date());
    
    // Start XML sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    let totalUrls = 0;

    // Add static pages
    console.log('📄 Adding static pages...');
    staticPages.forEach(page => {
      const fullUrl = `${baseUrl}${page.url}`;
      if (validateUrl(fullUrl)) {
        sitemap += `  <url>
    <loc>${escapeXml(fullUrl)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
        totalUrls++;
      }
    });

    // Add category pages
    console.log('🏷️ Adding category pages...');
    productCategories.forEach(category => {
      const categoryUrl = `${baseUrl}/categories?category=${encodeURIComponent(category)}`;
      sitemap += `  <url>
    <loc>${escapeXml(categoryUrl)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      totalUrls++;
    });

    // Fetch and add product pages
    if (supabase) {
      console.log('🛍️ Fetching products from database...');
      try {
        const { data: products, error } = await supabase
          .from('products')
          .select('id, name, category, updated_at, image_url')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(5000); // Google sitemap limit

        if (error) {
          console.warn('⚠️ Could not fetch products:', error.message);
        } else if (products && products.length > 0) {
          console.log(`📦 Adding ${products.length} product pages...`);
          
          products.forEach(product => {
            if (product.id) {
              const productUrl = `${baseUrl}/product/${product.id}`;
              const lastmod = formatDateForXml(product.updated_at || new Date());
              
              sitemap += `  <url>
    <loc>${escapeXml(productUrl)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;
              
              // Add image if available
              if (product.image_url) {
                const imageUrl = product.image_url.startsWith('http') 
                  ? product.image_url 
                  : `${baseUrl}${product.image_url}`;
                
                if (validateUrl(imageUrl)) {
                  sitemap += `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:caption>${escapeXml(product.name || 'Product Image')}</image:caption>
    </image:image>`;
                }
              }
              
              sitemap += `
  </url>
`;
              totalUrls++;
            }
          });
        }
      } catch (dbError) {
        console.warn('⚠️ Database connection failed, using static sitemap only:', dbError.message);
      }
    } else {
      console.log('ℹ️ No database connection, using static pages only');
    }

    // Close sitemap
    sitemap += '</urlset>';

    // Validate XML
    if (!sitemap.includes('<?xml') || !sitemap.includes('</urlset>')) {
      throw new Error('Invalid XML structure generated');
    }

    // Write main sitemap
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');

    // Create sitemap index if we have many URLs
    if (totalUrls > 1000) {
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(baseUrl)}/sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`;
      
      const indexPath = path.join(process.cwd(), 'public', 'sitemap-index.xml');
      fs.writeFileSync(indexPath, sitemapIndex, 'utf8');
      console.log('📑 Created sitemap index for large sitemap');
    }

    // Verify file was written correctly
    const fileSize = fs.statSync(sitemapPath).size;
    
    console.log('✅ Sitemap generated successfully!');
    console.log(`   📊 Total URLs: ${totalUrls}`);
    console.log(`   📁 File size: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`   📍 Location: ${sitemapPath}`);
    console.log(`   🌐 URL: ${baseUrl}/sitemap.xml`);
    console.log('');
    console.log('🔍 Ready for Google Search Console submission!');
    console.log('📋 Next steps:');
    console.log('   1. Submit sitemap to Google Search Console');
    console.log('   2. Test with Google\'s sitemap validator');
    console.log('   3. Monitor indexing status');

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    
    // Create fallback minimal sitemap
    console.log('🆘 Creating fallback sitemap...');
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://dankdealsmn.com/</loc>
    <lastmod>${formatDateForXml(new Date())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, fallbackSitemap, 'utf8');
    console.log('⚠️ Minimal fallback sitemap created');
    
    process.exit(1);
  }
}

generateSitemap(); 