// src/hooks/useCart.tsx
import { useContext } from 'react';
import { CartContext } from './CartContext';

export type { CartItem } from '@/types/cart';

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
