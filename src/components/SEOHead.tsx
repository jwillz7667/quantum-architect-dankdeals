import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: object;
  breadcrumbs?: Array<{ name: string; url: string }>;
  canonicalUrl?: string;
  article?: boolean;
}

// Site configuration with proper environment variable access
const SITE_URL = (import.meta.env['VITE_SITE_URL'] as string) || 'https://dankdealsmn.com';
const SITE_NAME = 'DankDeals MN';
const SITE_DESCRIPTION =
  "Minnesota's premier cannabis delivery service. Premium flower, edibles, and concentrates delivered to your door. 21+ only.";

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'DankDeals MN - Premium Cannabis Delivery in Minnesota',
  description = SITE_DESCRIPTION,
  keywords = 'cannabis delivery, marijuana delivery, Minnesota cannabis, THC delivery, CBD products, premium flower, edibles, concentrates',
  image = `${SITE_URL}/og-image.jpg`,
  url = SITE_URL,
  type = 'website',
  twitterCard = 'summary_large_image',
  author = 'DankDeals MN',
  publishedTime,
  modifiedTime,
  structuredData,
  breadcrumbs,
  canonicalUrl,
  article,
}) => {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const fullUrl = canonicalUrl || (url.startsWith('http') ? url : `${SITE_URL}${url}`);
  const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  const actualType = article ? 'article' : type;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={actualType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@DankDealsMN" />
      <meta name="twitter:creator" content="@DankDealsMN" />

      {/* Article specific meta tags */}
      {actualType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {actualType === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {actualType === 'article' && <meta property="article:author" content={author} />}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}

      {/* Breadcrumbs Structured Data */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((crumb, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: crumb.name,
              item: crumb.url.startsWith('http') ? crumb.url : `${SITE_URL}${crumb.url}`,
            })),
          })}
        </script>
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
