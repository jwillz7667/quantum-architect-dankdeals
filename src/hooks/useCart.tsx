// src/hooks/useCart.tsx
import { useContext } from 'react';
import { CartContext } from './CartProvider';

export interface CartItem {
  id: string; // unique identifier for cart item
  productId: string;
  variantId: string;
  name: string;
  price: number; // in dollars (not cents)
  quantity: number;
  image: string;
  variant: {
    name: string;
    weight_grams: number;
  };
  category: string;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
