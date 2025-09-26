import { describe, expect, it } from 'vitest';

import { mapProductRowToUpsertInput, type AdminProduct } from '../products';

describe('mapProductRowToUpsertInput', () => {
  it('normalises product and variant properties for RPC payloads', () => {
    const product: AdminProduct = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Wedding Cake',
      description: 'Indica-dominant hybrid with sweet notes',
      category: 'flower',
      price: 45,
      image_url: 'https://cdn.example.com/wedding-cake.webp',
      gallery_urls: ['https://cdn.example.com/wedding-cake-1.webp'],
      thc_content: 22.5,
      cbd_content: 0.4,
      strain_type: 'indica',
      effects: ['relaxed', 'euphoric'],
      flavors: ['sweet'],
      stock_quantity: 20,
      weight_grams: null,
      is_active: true,
      is_featured: true,
      lab_tested: true,
      lab_results_url: 'https://cdn.example.com/labs/wedding-cake.pdf',
      search_vector: null,
      slug: 'wedding-cake',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      variants: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          product_id: '11111111-1111-1111-1111-111111111111',
          name: '1/8 oz',
          price: 35,
          weight_grams: 3.5,
          inventory_count: 12,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    } as unknown as AdminProduct;

    const payload = mapProductRowToUpsertInput(product);

    expect(payload.product).toMatchObject({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Wedding Cake',
      category: 'flower',
      is_active: true,
      is_featured: true,
      effects: ['relaxed', 'euphoric'],
      flavors: ['sweet'],
    });

    expect(payload.variants).toHaveLength(1);
    expect(payload.variants?.[0]).toMatchObject({
      id: '22222222-2222-2222-2222-222222222222',
      name: '1/8 oz',
      price: 35,
      inventory_count: 12,
      is_active: true,
    });
  });
});
