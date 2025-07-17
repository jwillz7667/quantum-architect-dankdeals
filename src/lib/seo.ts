import type { Product } from '@/hooks/useProducts';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  product?: {
    price?: number;
    currency?: string;
    availability?: 'in stock' | 'out of stock' | 'preorder';
    brand?: string;
    category?: string;
  };
}

export const defaultSEO: SEOProps = {
  title: 'DankDeals - Premium Cannabis Delivery in Minnesota',
  description:
    "Minnesota's premier cannabis delivery service. Shop premium flower, edibles, concentrates & more. Same-day delivery across Minneapolis, St. Paul & surrounding areas. Age 21+ only.",
  keywords:
    'cannabis delivery Minnesota, marijuana delivery Minneapolis, weed delivery St Paul, same day cannabis delivery, dispensary near me',
  image: 'https://dankdealsmn.com/og-image.png',
  url: 'https://dankdealsmn.com',
  type: 'website',
};

export function generateMetaTags(props: SEOProps): Record<string, string> {
  const seo = { ...defaultSEO, ...props };
  const fullTitle = seo.title === defaultSEO.title ? seo.title : `${seo.title} | DankDeals`;

  return {
    title: fullTitle,
    description: seo.description || defaultSEO.description,
    keywords: seo.keywords || defaultSEO.keywords,
    'og:title': fullTitle,
    'og:description': seo.description || defaultSEO.description,
    'og:image': seo.image || defaultSEO.image,
    'og:url': seo.url || defaultSEO.url,
    'og:type': seo.type || 'website',
    'twitter:title': fullTitle,
    'twitter:description': seo.description || defaultSEO.description,
    'twitter:image': seo.image || defaultSEO.image,
  };
}

export function generateProductSchema(product: Product) {
  const minPrice = Math.min(...product.variants.map((v) => v.price / 100));
  const maxPrice = Math.max(...product.variants.map((v) => v.price / 100));
  const inStock = product.variants.some((v) => (v.inventory_count || 0) > 0);

  // Enhanced image data for better SEO
  const imageData = product.image_url
    ? {
        '@type': 'ImageObject',
        url: product.image_url,
        width: 400,
        height: 400,
      }
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: imageData,
    brand: {
      '@type': 'Brand',
      name: 'DankDeals',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: minPrice.toFixed(2),
      highPrice: maxPrice.toFixed(2),
      offerCount: product.variants.length,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'DankDeals',
        url: 'https://dankdealsmn.com',
      },
      url: `https://dankdealsmn.com/product/${product.id}`,
    },
    category: product.category,
    sku: product.id,
    gtin: product.id, // Using product ID as GTIN for uniqueness
    mpn: product.name.toLowerCase().replace(/\s+/g, '-'), // Manufacturer part number
    ...(product.thc_content && {
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'THC Content',
          value: `${product.thc_content}%`,
          unitCode: 'P1', // Percentage unit code
        },
        ...(product.cbd_content
          ? [
              {
                '@type': 'PropertyValue',
                name: 'CBD Content',
                value: `${product.cbd_content}%`,
                unitCode: 'P1',
              },
            ]
          : []),
      ],
    }),
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateArticleSchema(article: {
  title: string;
  description: string;
  author: string;
  publishedDate: string;
  modifiedDate?: string;
  image?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    datePublished: article.publishedDate,
    dateModified: article.modifiedDate || article.publishedDate,
    image: article.image || 'https://dankdealsmn.com/og-image.png',
    publisher: {
      '@type': 'Organization',
      name: 'DankDeals',
      logo: {
        '@type': 'ImageObject',
        url: 'https://dankdealsmn.com/apple-touch-icon.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const baseUrl = 'https://dankdealsmn.com';
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ name: 'Home', url: baseUrl }];

  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Handle special cases for better names
    let name = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Special naming for known routes
    switch (segment) {
      case 'blog':
        name = 'Blog';
        break;
      case 'cart':
        name = 'Shopping Cart';
        break;
      case 'profile':
        name = 'My Profile';
        break;
      case 'categories':
        name = 'Categories';
        break;
      case 'delivery-area':
        name = 'Delivery Area';
        break;
      case 'faq':
        name = 'FAQ';
        break;
      case 'auth':
        name = 'Sign In';
        break;
      case 'checkout':
        name = 'Checkout';
        break;
      case 'product':
        // Skip 'product' segment as the next segment will be the product name
        if (index === segments.length - 2) {
          return;
        }
        break;
    }

    // For product pages, use the last segment as the product name
    if (segments[index - 1] === 'product' && index === segments.length - 1) {
      name = name.replace(/^\d+-/, ''); // Remove leading numbers if any
    }

    breadcrumbs.push({
      name,
      url: `${baseUrl}${currentPath}`,
    });
  });

  return breadcrumbs;
}
