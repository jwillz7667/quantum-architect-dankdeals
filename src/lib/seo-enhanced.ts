/**
 * Enhanced SEO utilities for React SPA
 * Provides comprehensive structured data and meta tag management
 */

import { env } from './env';

// Site configuration
const SITE_URL = env.VITE_SITE_URL || 'https://dankdealsmn.com';
const SITE_NAME = 'DankDeals MN';

interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  image: string;
  url: string;
  type: 'website' | 'article' | 'product';
  siteName: string;
}

interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

export class SEOEnhanced {
  private static defaultConfig: SEOConfig = {
    title: 'DankDeals MN - Premium Cannabis Delivery in Minnesota',
    description:
      "Minnesota's premier cannabis delivery service. Premium flower, edibles, and concentrates delivered to your door. 21+ only.",
    keywords:
      'cannabis delivery, marijuana delivery, Minnesota cannabis, THC delivery, CBD products, premium flower, edibles, concentrates',
    image: `${SITE_URL}/og-image.jpg`,
    url: SITE_URL,
    type: 'website',
    siteName: SITE_NAME,
  };

  /**
   * Generate comprehensive SEO meta tags
   */
  static generateMetaTags(config: Partial<SEOConfig> = {}): Record<string, string> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const fullTitle = mergedConfig.title.includes(SITE_NAME)
      ? mergedConfig.title
      : `${mergedConfig.title} | ${SITE_NAME}`;

    return {
      title: fullTitle,
      description: mergedConfig.description,
      keywords: mergedConfig.keywords,
      'og:title': fullTitle,
      'og:description': mergedConfig.description,
      'og:image': mergedConfig.image,
      'og:url': mergedConfig.url,
      'og:type': mergedConfig.type,
      'og:site_name': mergedConfig.siteName,
      'twitter:card': 'summary_large_image',
      'twitter:title': fullTitle,
      'twitter:description': mergedConfig.description,
      'twitter:image': mergedConfig.image,
    };
  }

  /**
   * Generate structured data for different content types
   */
  static generateStructuredData(type: string, data: Record<string, unknown>): StructuredData {
    const baseData: StructuredData = {
      '@context': 'https://schema.org',
      '@type': type,
    };

    return { ...baseData, ...data };
  }

  /**
   * Generate organization structured data
   */
  static generateOrganizationData(): StructuredData {
    return this.generateStructuredData('Organization', {
      name: SITE_NAME,
      description: this.defaultConfig.description,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-555-DANK-DEAL',
        contactType: 'customer service',
        availableLanguage: 'English',
        areaServed: 'Minnesota, US',
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Minneapolis',
        addressRegion: 'Minnesota',
        addressCountry: 'US',
      },
      sameAs: ['https://twitter.com/DankDealsMN', 'https://instagram.com/DankDealsMN'],
    });
  }

  /**
   * Generate website structured data
   */
  static generateWebsiteData(): StructuredData {
    return this.generateStructuredData('WebSite', {
      name: SITE_NAME,
      description: this.defaultConfig.description,
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    });
  }

  /**
   * Generate product structured data
   */
  static generateProductData(product: {
    name: string;
    description: string;
    image: string;
    price: number;
    category: string;
    thcContent?: number;
    cbdContent?: number;
  }): StructuredData {
    return this.generateStructuredData('Product', {
      name: product.name,
      description: product.description,
      image: product.image,
      category: product.category,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: SITE_NAME,
        },
      },
      additionalProperty: [
        ...(product.thcContent
          ? [
              {
                '@type': 'PropertyValue',
                name: 'THC Content',
                value: `${product.thcContent}%`,
              },
            ]
          : []),
        ...(product.cbdContent
          ? [
              {
                '@type': 'PropertyValue',
                name: 'CBD Content',
                value: `${product.cbdContent}%`,
              },
            ]
          : []),
      ],
    });
  }

  /**
   * Generate breadcrumb structured data
   */
  static generateBreadcrumbData(breadcrumbs: Array<{ name: string; url: string }>): StructuredData {
    return this.generateStructuredData('BreadcrumbList', {
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url.startsWith('http') ? crumb.url : `${SITE_URL}${crumb.url}`,
      })),
    });
  }
}
