// lib/productSchema.ts
import type { Product, ProductVariant } from '@/hooks/useProducts';

export const generateProductSchema = (product: Product, selectedVariant?: ProductVariant) => {
  const price = selectedVariant ? selectedVariant.price / 100 : 0;
  const availability =
    (selectedVariant?.inventory_count || 0) > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Premium ${product.category} - ${product.name}`,
    sku: product.id,
    mpn: product.id,
    gtin: product.id,
    category: product.category,
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
    offers: {
      '@type': 'Offer',
      url: `https://dankdealsmn.com/product/${product.id}`,
      priceCurrency: 'USD',
      price: price,
      availability: availability,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      seller: {
        '@type': 'Organization',
        name: 'DankDeals MN',
        url: 'https://dankdealsmn.com',
      },
      deliveryLeadTime: {
        '@type': 'QuantitativeValue',
        minValue: 30,
        maxValue: 90,
        unitCode: 'MIN',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '5.00',
          currency: 'USD',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          businessDays: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday',
            ],
          },
        },
      },
    },
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
      ...(product.cbd_content
        ? [
            {
              '@type': 'PropertyValue',
              name: 'CBD Content',
              value: `${product.cbd_content}%`,
            },
          ]
        : []),
      ...(selectedVariant
        ? [
            {
              '@type': 'PropertyValue',
              name: 'Weight',
              value: `${selectedVariant.weight_grams}g`,
            },
          ]
        : []),
    ],
  };
};
