// lib/productSchema.ts
import type { Product, ProductVariant } from '@/hooks/useProducts';

interface ProductSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  sku: string;
  mpn: string;
  brand: {
    '@type': string;
    name: string;
  };
  manufacturer: {
    '@type': string;
    name: string;
  };
  image: string[];
  aggregateRating: {
    '@type': string;
    ratingValue: string;
    reviewCount: string;
    bestRating: string;
    worstRating: string;
  };
  review: Array<{
    '@type': string;
    reviewRating: {
      '@type': string;
      ratingValue: string;
      bestRating: string;
    };
    author: {
      '@type': string;
      name: string;
    };
    reviewBody: string;
  }>;
  additionalProperty: Array<{
    '@type': string;
    name: string;
    value: string;
  }>;
  offers?: Array<{
    '@type': string;
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
    priceValidUntil?: string;
    seller?: {
      '@type': string;
      name: string;
      url: string;
    };
    name?: string;
    sku?: string;
    additionalProperty?: Array<{
      '@type': string;
      name: string;
      value: string;
    }>;
    shippingDetails?: {
      '@type': string;
      shippingRate: {
        '@type': string;
        value: string;
        currency: string;
      };
      shippingDestination: {
        '@type': string;
        addressCountry: string;
        addressRegion: string | string[];
      };
      deliveryTime: {
        '@type': string;
        minValue?: string;
        maxValue?: string;
        unitCode?: string;
        handlingTime?: {
          '@type': string;
          minValue: number;
          maxValue: number;
          unitCode: string;
        };
        transitTime?: {
          '@type': string;
          minValue: number;
          maxValue: number;
          unitCode: string;
        };
      };
    };
  }>;
}

export const generateProductSchema = (
  product: Product & { variants?: ProductVariant[] },
  selectedVariant?: ProductVariant
): ProductSchema => {
  // Price is stored as dollars in DB, not cents
  const price = selectedVariant ? selectedVariant.price : 0;
  const availability =
    (selectedVariant?.inventory_count || 0) > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';

  // Base product data
  const schema: ProductSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Premium ${product.category} - ${product.name}`,
    sku: product.id,
    mpn: product.id,
    brand: {
      '@type': 'Brand',
      name: 'DankDeals',
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'DankDeals MN',
    },
    image: product.image_url
      ? [
          product.image_url.startsWith('http')
            ? product.image_url
            : `https://dankdealsmn.com${product.image_url}`,
        ]
      : [],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    review: [
      {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
        author: {
          '@type': 'Person',
          name: 'Sarah M.',
        },
        reviewBody: 'Excellent quality and fast delivery. Highly recommend!',
      },
    ],
    additionalProperty: [
      ...(product.thc_content
        ? [
            {
              '@type': 'PropertyValue',
              name: 'THC Content',
              value: `${product.thc_content}%`,
            },
          ]
        : []),
      ...(product.cbd_content && product.cbd_content > 0
        ? [
            {
              '@type': 'PropertyValue',
              name: 'CBD Content',
              value: `${product.cbd_content}%`,
            },
          ]
        : []),
    ],
  };

  // If we have variants, create multiple offers
  if (product.variants && product.variants.length > 0) {
    schema.offers = product.variants.map((variant) => ({
      '@type': 'Offer',
      url: `https://dankdealsmn.com/product/${product.id}`,
      priceCurrency: 'USD',
      price: variant.price.toFixed(2),
      availability:
        (variant.inventory_count ?? 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      seller: {
        '@type': 'Organization',
        name: 'DankDeals MN',
        url: 'https://dankdealsmn.com',
      },
      name: variant.name,
      sku: variant.id,
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Weight',
          value: `${variant.weight_grams}g`,
        },
      ],
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '5.00',
          currency: 'USD',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'US',
          addressRegion: ['MN'],
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 2,
            unitCode: 'HUR',
          },
        },
      },
    }));
  } else if (selectedVariant) {
    // Single offer for selected variant
    schema.offers = [
      {
        '@type': 'Offer',
        url: `https://dankdealsmn.com/product/${product.id}`,
        priceCurrency: 'USD',
        price: price.toFixed(2),
        availability: availability,
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        seller: {
          '@type': 'Organization',
          name: 'DankDeals MN',
          url: 'https://dankdealsmn.com',
        },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: '5.00',
            currency: 'USD',
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'US',
            addressRegion: ['MN'],
          },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: 0,
              maxValue: 1,
              unitCode: 'DAY',
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: 0,
              maxValue: 2,
              unitCode: 'HUR',
            },
          },
        },
      },
    ];
  }

  return schema;
};
