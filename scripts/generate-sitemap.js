// scripts/generate-sitemap.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ralbzuvkyexortqngvxs.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.log('Info: VITE_SUPABASE_ANON_KEY not found, generating static sitemap without products');
}

// Only create Supabase client if we have the key
const supabase = supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/categories', changefreq: 'weekly', priority: 0.9 },
  { url: '/delivery-area', changefreq: 'weekly', priority: 0.8 },
  { url: '/faq', changefreq: 'monthly', priority: 0.7 },
  { url: '/blog', changefreq: 'weekly', priority: 0.8 },
  { url: '/legal', changefreq: 'monthly', priority: 0.6 },
  { url: '/privacy', changefreq: 'monthly', priority: 0.6 },
  { url: '/terms', changefreq: 'monthly', priority: 0.6 },
  { url: '/auth', changefreq: 'monthly', priority: 0.5 },
];

// XML escape function to ensure proper encoding
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// URL validation and encoding
function validateAndEncodeUrl(url) {
  try {
    // Ensure URL is properly formatted
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch (error) {
    console.warn(`Invalid URL skipped: ${url}`);
    return null;
  }
}

// Date formatting for XML
function formatDateForXml(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return d.toISOString().split('T')[0];
}

async function generateSitemap() {
  try {
    let products = null;
    
    // Only fetch products if we have Supabase connection
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('id, updated_at, category, name')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching products:', error);
        console.log('Continuing with static sitemap generation...');
      } else {
        products = data;
      }
    }

    const baseUrl = 'https://dankdealsmn.com';
    const currentDate = formatDateForXml(new Date());

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add static pages with proper validation
    staticPages.forEach(page => {
      const fullUrl = validateAndEncodeUrl(baseUrl + page.url);
      if (fullUrl) {
        sitemap += `  <url>
    <loc>${escapeXml(fullUrl)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
  </url>
`;
      }
    });

    // Add product pages (limit to 1000 for sitemap standards)
    if (products && products.length > 0) {
      const limitedProducts = products.slice(0, 1000);
      limitedProducts.forEach(product => {
        const productUrl = validateAndEncodeUrl(`${baseUrl}/product/${product.id}`);
        if (productUrl && product.id) {
          const lastmod = formatDateForXml(product.updated_at || new Date());
          sitemap += `  <url>
    <loc>${escapeXml(productUrl)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        }
      });
    }

    sitemap += '</urlset>';

    // Validate XML structure
    try {
      // Basic XML validation
      if (!sitemap.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
        throw new Error('Missing XML declaration');
      }
      if (!sitemap.includes('<urlset')) {
        throw new Error('Missing urlset element');
      }
      if (!sitemap.includes('</urlset>')) {
        throw new Error('Missing closing urlset tag');
      }
      
      // Check for common XML issues
      const openTags = (sitemap.match(/<url>/g) || []).length;
      const closeTags = (sitemap.match(/<\/url>/g) || []).length;
      if (openTags !== closeTags) {
        throw new Error(`Mismatched URL tags: ${openTags} open, ${closeTags} close`);
      }
      
    } catch (validationError) {
      console.error('XML validation failed:', validationError.message);
      throw validationError;
    }

    // Write sitemap to public directory
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    
    // Generate sitemap index if needed (for large sitemaps)
    if (products && products.length > 1000) {
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(baseUrl)}/sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`;
      
      const indexPath = path.join(process.cwd(), 'public', 'sitemap-index.xml');
      fs.writeFileSync(indexPath, sitemapIndex, 'utf8');
      console.log('Sitemap index generated for large sitemap');
    }
    
    const productCount = products ? Math.min(products.length, 1000) : 0;
    const totalUrls = staticPages.length + productCount;
    
    console.log(`✅ Sitemap generated successfully!`);
    console.log(`   - ${staticPages.length} static pages`);
    console.log(`   - ${productCount} product pages`);
    console.log(`   - ${totalUrls} total URLs`);
    console.log(`   - Saved to: ${sitemapPath}`);
    
    // Final validation check
    const generatedContent = fs.readFileSync(sitemapPath, 'utf8');
    if (generatedContent.includes('&amp;amp;')) {
      console.warn('⚠️  Warning: Double-encoded ampersands detected');
    }
    
    console.log(`🔍 Sitemap ready for Google Search Console: ${baseUrl}/sitemap.xml`);
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap(); 