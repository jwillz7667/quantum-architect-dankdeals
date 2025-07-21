import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  article?: boolean;
  canonicalUrl?: string;
  noindex?: boolean;
  url?: string;
  type?: string;
  structuredData?: StructuredData | StructuredData[];
  breadcrumbs?: BreadcrumbItem[];
}

const DEFAULT_TITLE = 'DankDeals - Premium Cannabis Delivery in Minneapolis';
const DEFAULT_DESCRIPTION =
  'Minneapolis premier cannabis delivery service. Get premium flower, edibles, and more delivered to your door. 21+ only. Cash on delivery.';
const DEFAULT_IMAGE = '/og-image.png';
const SITE_URL = (import.meta.env.VITE_SITE_URL as string) || 'https://dankdealsmn.com';

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  image = DEFAULT_IMAGE,
  article = false,
  canonicalUrl,
  noindex = false,
  url,
  type,
  structuredData,
  breadcrumbs,
}: SEOHeadProps) {
  const location = useLocation();
  const fullTitle = title ? `${title} | DankDeals` : DEFAULT_TITLE;
  const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  const canonical = canonicalUrl || url || `${SITE_URL}${location.pathname}`;

  const defaultJsonLd: StructuredData = {
    '@context': 'https://schema.org',
    '@type': article ? 'Article' : 'WebSite',
    name: 'DankDeals',
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    ...(article
      ? {
          headline: title,
          image: fullImage,
          datePublished: new Date().toISOString(),
          author: {
            '@type': 'Organization',
            name: 'DankDeals',
          },
        }
      : {
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        }),
  };

  // Create breadcrumb structured data if breadcrumbs are provided
  const breadcrumbJsonLd = breadcrumbs
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      }
    : null;

  // Combine all structured data
  const allJsonLdData: StructuredData[] = (() => {
    const dataArray: StructuredData[] = [];

    // Add the main structured data
    if (structuredData) {
      if (Array.isArray(structuredData)) {
        dataArray.push(...structuredData);
      } else {
        dataArray.push(structuredData);
      }
    } else {
      dataArray.push(defaultJsonLd);
    }

    // Add breadcrumb data if available
    if (breadcrumbJsonLd) {
      dataArray.push(breadcrumbJsonLd);
    }

    return dataArray;
  })();

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type || (article ? 'article' : 'website')} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="DankDeals" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Additional SEO */}
      <meta name="theme-color" content="#10b981" />
      <meta name="apple-mobile-web-app-title" content="DankDeals" />
      <meta name="application-name" content="DankDeals" />

      {/* JSON-LD Structured Data */}
      {allJsonLdData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}
