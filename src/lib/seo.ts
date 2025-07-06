import { Product } from '@/hooks/useProducts';

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

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: product.image_url || '',
    brand: {
      '@type': 'Brand',
      name: product.vendor.name,
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
      },
    },
    category: product.category,
    ...(product.thc_content && {
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'THC Content',
          value: `${product.thc_content}%`,
        },
      ],
    }),
    ...(product.cbd_content && {
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'CBD Content',
          value: `${product.cbd_content}%`,
        },
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
