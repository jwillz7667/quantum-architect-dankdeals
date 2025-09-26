import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import AdminProductForm from '../AdminProductForm';
import type { UpsertAdminProductInput } from '@/lib/admin/products';

describe('AdminProductForm', () => {
  it('submits a sanitized payload for a new product', async () => {
    const onSubmit = vi.fn(async (_payload: UpsertAdminProductInput) => {});

    render(<AdminProductForm onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText('Name');
    await userEvent.type(nameInput, 'Sunset Sherbet');

    const basePriceInput = screen.getByLabelText('Base price');
    const variantPriceInput = screen.getByLabelText('Price', {
      selector: '#variant-price-0',
    });
    await userEvent.clear(basePriceInput);
    await userEvent.type(basePriceInput, '45');

    const variantNameInput = screen.getByLabelText('Variant name', {
      selector: '#variant-name-0',
    });
    await userEvent.clear(variantNameInput);
    await userEvent.type(variantNameInput, '1/8 oz (3.5g)');

    await userEvent.clear(variantPriceInput);
    await userEvent.type(variantPriceInput, '35');

    const inventoryInput = screen.getByLabelText('Inventory', {
      selector: '#variant-inventory-0',
    });
    await userEvent.clear(inventoryInput);
    await userEvent.type(inventoryInput, '10');

    const thcInput = screen.getByLabelText('THC %');
    await userEvent.type(thcInput, '20');

    const cbdInput = screen.getByLabelText('CBD %');
    await userEvent.type(cbdInput, '1');

    const galleryTextarea = screen.getByLabelText(/Gallery image URLs/i);
    await userEvent.type(galleryTextarea, 'https://cdn.example.com/sherbet.webp');

    const effectsTextarea = screen.getByLabelText('Effects');
    await userEvent.type(effectsTextarea, 'Creative');

    const flavorsTextarea = screen.getByLabelText('Flavors');
    await userEvent.type(flavorsTextarea, 'Orange');

    const submitButton = screen.getByRole('button', { name: /save product/i });
    await userEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);

    const firstCall = onSubmit.mock.calls[0];
    if (!firstCall || firstCall.length === 0) {
      throw new Error('Expected submit handler to be invoked.');
    }

    const [payload] = firstCall as [UpsertAdminProductInput];

    expect(payload.product).toMatchObject({
      name: 'Sunset Sherbet',
      category: 'flower',
      price: 45,
      thc_content: 20,
      cbd_content: 1,
      gallery_urls: ['https://cdn.example.com/sherbet.webp'],
      effects: ['Creative'],
      flavors: ['Orange'],
      is_active: true,
    });

    expect(payload.variants).toHaveLength(1);
    expect(payload.variants[0]).toMatchObject({
      name: '1/8 oz (3.5g)',
      price: 35,
      inventory_count: 10,
      is_active: true,
    });
  });
});
