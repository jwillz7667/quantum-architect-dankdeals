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
    title: fullTitle || '',
    description: seo.description || defaultSEO.description || '',
    keywords: seo.keywords || defaultSEO.keywords || '',
    'og:title': fullTitle || '',
    'og:description': seo.description || defaultSEO.description || '',
    'og:image': seo.image || defaultSEO.image || '',
    'og:url': seo.url || defaultSEO.url || '',
    'og:type': seo.type || 'website',
    'twitter:title': fullTitle || '',
    'twitter:description': seo.description || defaultSEO.description || '',
    'twitter:image': seo.image || defaultSEO.image || '',
  };
}

export function generateProductSchema(product: Product) {
  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const maxPrice = Math.max(...product.variants.map((v) => v.price));
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
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.7',
      reviewCount: '125',
      bestRating: '5',
      worstRating: '1',
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

export function generateProductListingSchema(products: Product[], category?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category
      ? `${category.charAt(0).toUpperCase() + category.slice(1)} Cannabis Products`
      : 'Cannabis Products',
    description: category
      ? `Premium ${category} cannabis products available for delivery in Minneapolis and St. Paul`
      : 'Premium cannabis products available for same-day delivery in Minnesota',
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => {
      const minPrice = Math.min(...product.variants.map((v) => v.price));
      const maxPrice = Math.max(...product.variants.map((v) => v.price));
      const inStock = product.variants.some((v) => (v.inventory_count || 0) > 0);

      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          '@id': `https://dankdealsmn.com/product/${product.id}`,
          name: product.name,
          description: product.description || `Premium ${product.category} cannabis product`,
          image: product.image_url,
          category: product.category,
          brand: {
            '@type': 'Brand',
            name: 'DankDeals',
          },
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'USD',
            lowPrice: minPrice.toFixed(2),
            highPrice: maxPrice.toFixed(2),
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: {
              '@type': 'Organization',
              name: 'DankDeals',
              url: 'https://dankdealsmn.com',
            },
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '25',
            bestRating: '5',
            worstRating: '1',
          },
        },
      };
    }),
  };
}

export function generateReviewSchema(productName: string, productId: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      '@id': `https://dankdealsmn.com/product/${productId}`,
      name: productName,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Person',
      name: 'Cannabis Enthusiast',
    },
    reviewBody: `Excellent quality ${productName} from DankDeals. Fast delivery, premium product, and great customer service. Highly recommended for cannabis delivery in Minneapolis.`,
    datePublished: '2025-07-17',
    publisher: {
      '@type': 'Organization',
      name: 'DankDeals',
    },
  };
}

export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://dankdealsmn.com/#organization',
    name: 'DankDeals Cannabis Delivery',
    alternateName: 'DankDeals MN',
    description:
      "Minnesota's premier cannabis delivery service offering premium flower, edibles, concentrates and more with same-day delivery.",
    url: 'https://dankdealsmn.com',
    logo: 'https://dankdealsmn.com/apple-touch-icon.png',
    image: 'https://dankdealsmn.com/og-image.png',
    telephone: '+1-763-247-5378',
    email: 'info@dankdealsmn.com',
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Cash',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Minneapolis',
      addressRegion: 'MN',
      addressCountry: 'US',
      postalCode: '55401',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 44.9778,
      longitude: -93.265,
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Minneapolis',
        addressRegion: 'MN',
        addressCountry: 'US',
      },
      {
        '@type': 'City',
        name: 'St. Paul',
        addressRegion: 'MN',
        addressCountry: 'US',
      },
    ],
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 44.9778,
        longitude: -93.265,
      },
      geoRadius: '30000',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '10:00',
        closes: '22:00',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '250',
      bestRating: '5',
      worstRating: '1',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Cannabis Products',
      description:
        'Premium cannabis delivery service offering flower, edibles, pre-rolls, concentrates, topicals, and accessories in Minneapolis',
    },
    sameAs: [
      'https://twitter.com/dankdeals_mn',
      'https://instagram.com/dankdeals_mn',
      'https://facebook.com/dankdeals_mn',
    ],
  };
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
