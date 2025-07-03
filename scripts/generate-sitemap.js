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

async function generateSitemap() {
  try {
    let products = null;
    
    // Only fetch products if we have Supabase connection
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('id, updated_at, category')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching products:', error);
        console.log('Continuing with static sitemap generation...');
      } else {
        products = data;
      }
    }

    const baseUrl = 'https://dankdealsmn.com';
    const currentDate = new Date().toISOString().split('T')[0];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add static pages
    staticPages.forEach(page => {
      sitemap += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });

    // Add product pages
    if (products) {
      products.forEach(product => {
        const lastmod = product.updated_at ? new Date(product.updated_at).toISOString().split('T')[0] : currentDate;
        sitemap += `  <url>
    <loc>${baseUrl}/product/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      });
    }

    sitemap += '</urlset>';

    // Write sitemap to public directory
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap);
    
    if (products) {
      console.log(`Sitemap generated successfully with ${staticPages.length} static pages and ${products.length} product pages!`);
    } else {
      console.log(`Sitemap generated successfully with ${staticPages.length} static pages (no products - database not available)!`);
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap(); 