import { createContext } from 'react';
import type { Product, ProductVariant } from '@/hooks/useProducts';
import type { CartItem } from '@/types/cart';

export interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  isLoading: boolean;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
