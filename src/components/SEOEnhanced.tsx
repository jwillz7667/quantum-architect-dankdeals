import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOEnhancedProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: object;
}

// Default meta configuration
const defaultMeta = {
  title: 'DankDeals MN - Premium Cannabis Delivery in Minnesota',
  description:
    "Minnesota's premier cannabis delivery service. Premium flower, edibles, and concentrates delivered to your door. 21+ only.",
  keywords:
    'cannabis delivery, marijuana delivery, Minnesota cannabis, THC delivery, CBD products, premium flower, edibles, concentrates',
  image: '/og-image.jpg',
  type: 'website' as const,
  author: 'DankDeals MN',
};

export const SEOEnhanced: React.FC<SEOEnhancedProps> = ({
  title = defaultMeta.title,
  description = defaultMeta.description,
  keywords = defaultMeta.keywords,
  image = defaultMeta.image,
  url = '/',
  type = defaultMeta.type,
  author = defaultMeta.author,
  publishedTime,
  modifiedTime,
  structuredData,
}) => {
  // Generate meta tags object
  const metaTags = {
    title: title,
    description: description,
    keywords: keywords || '',
  };

  const siteUrl = (import.meta.env['VITE_SITE_URL'] as string) || 'https://dankdealsmn.com';
  const fullTitle = title.includes('DankDeals') ? title : `${title} | DankDeals MN`;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaTags.description} />
      {metaTags.keywords && <meta name="keywords" content={metaTags.keywords} />}
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaTags.description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="DankDeals MN" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaTags.description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@DankDealsMN" />
      <meta name="twitter:creator" content="@DankDealsMN" />

      {/* Article specific meta tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && <meta property="article:author" content={author} />}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  );
};

// Export a provider wrapper for the app
export function SEOProvider({ children }: { children: React.ReactNode }) {
  return <HelmetProvider>{children}</HelmetProvider>;
}
