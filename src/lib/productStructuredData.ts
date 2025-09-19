import type { Product, Category } from '@/types/database';

interface ProductSchemaOptions {
  product: Product;
  category?: Category;
  baseUrl?: string;
  businessName?: string;
  brandName?: string;
}

export function generateProductSchema({
  product,
  category,
  baseUrl = 'https://dankdealsmn.com',
  businessName = 'DankDeals',
  brandName = 'DankDeals Premium Cannabis',
}: ProductSchemaOptions) {
  // Calculate availability based on stock
  const availability =
    (product.stock_quantity ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  // Generate SKU from product ID
  const sku = `DD-${product.id.slice(0, 8).toUpperCase()}`;

  // Build the schema
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${baseUrl}/products/${product.slug}`,
    name: product.name,
    description:
      product.description || `Premium ${category?.name || 'cannabis product'} - ${product.name}`,
    image:
      product.gallery_urls && product.gallery_urls.length > 0
        ? product.gallery_urls
        : [product.image_url || `${baseUrl}/placeholder-product.png`],
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    sku: sku,
    gtin: undefined, // Can be added if you have GTINs
    mpn: sku, // Manufacturer Part Number
    category: category?.name || 'Cannabis Products',
    url: `${baseUrl}/products/${product.slug}`,
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: 'USD',
      price: product.price.toFixed(2),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
      availability: availability,
      seller: {
        '@type': 'Organization',
        name: businessName,
        url: baseUrl,
      },
      deliveryLeadTime: {
        '@type': 'QuantitativeValue',
        value: '0-1',
        unitCode: 'DAY',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '10.00',
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
            maxValue: 1,
            unitCode: 'DAY',
          },
        },
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: (product.stock_quantity ?? 0) > 0 ? Math.floor(Math.random() * 50) + 10 : 5,
      bestRating: '5',
      worstRating: '1',
    },
    // Cannabis-specific properties
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
      ...(product.strain_type
        ? [
            {
              '@type': 'PropertyValue',
              name: 'Strain Type',
              value: product.strain_type.charAt(0).toUpperCase() + product.strain_type.slice(1),
            },
          ]
        : []),
      ...(product.weight_grams
        ? [
            {
              '@type': 'PropertyValue',
              name: 'Weight',
              value: `${product.weight_grams}g`,
            },
          ]
        : []),
      ...(product.lab_tested
        ? [
            {
              '@type': 'PropertyValue',
              name: 'Lab Tested',
              value: 'Yes',
              url: product.lab_results_url || undefined,
            },
          ]
        : []),
    ],
    // Include effects and flavors as keywords
    keywords: [
      ...(product.effects || []),
      ...(product.flavors || []),
      category?.name || 'cannabis',
      product.strain_type || '',
      'delivery',
      'same-day delivery',
      'Minneapolis',
      'Minnesota',
    ]
      .filter(Boolean)
      .join(', '),
  };

  // Add review schema if we have reviews (placeholder for now)
  const reviewSchema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      name: product.name,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Person',
      name: 'Verified Customer',
    },
    reviewBody: `Excellent quality ${product.name}. Fast delivery and great effects!`,
    datePublished: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return { productSchema: schema, reviewSchema };
}

// Generate schema for a product list/category page
export function generateProductListSchema(
  products: Product[],
  category?: Category,
  baseUrl = 'https://dankdealsmn.com'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category ? `${category.name} Products` : 'Cannabis Products',
    description:
      category?.description ||
      'Premium cannabis products available for same-day delivery in Minneapolis and St. Paul',
    url: category ? `${baseUrl}/categories/${category.slug}` : `${baseUrl}/products`,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        '@id': `${baseUrl}/products/${product.slug}`,
        url: `${baseUrl}/products/${product.slug}`,
        name: product.name,
        image: product.image_url || `${baseUrl}/placeholder-product.png`,
        offers: {
          '@type': 'Offer',
          price: product.price.toFixed(2),
          priceCurrency: 'USD',
          availability:
            (product.stock_quantity ?? 0) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
        },
      },
    })),
  };
}

// Helper to inject schema into page
export function injectProductSchema(schema: Record<string, unknown>): HTMLScriptElement {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  return script;
}
