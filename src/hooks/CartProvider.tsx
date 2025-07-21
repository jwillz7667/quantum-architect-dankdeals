// src/hooks/CartProvider.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductVariant } from '@/hooks/useProducts';
import type { CartItem } from '@/types/cart';
import { CartContext, type CartContextType } from './CartContext';

const CART_STORAGE_KEY = 'dankdeals_cart';
const TAX_RATE = 0.1025; // Minnesota cannabis tax rate (example)
const DEFAULT_DELIVERY_FEE = 5.0;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Validate cart items against database
  const validateCartItems = useCallback(
    async (cartItems: CartItem[]): Promise<CartItem[]> => {
      if (cartItems.length === 0) return cartItems;

      try {
        const productIds = [...new Set(cartItems.map((item) => item.productId))];
        const { data: validProducts } = await supabase
          .from('products')
          .select('id')
          .in('id', productIds);

        const validProductIds = new Set(validProducts?.map((p: { id: string }) => p.id) || []);
        const validItems = cartItems.filter((item) => validProductIds.has(item.productId));

        const removedCount = cartItems.length - validItems.length;
        if (removedCount > 0) {
          console.log(`Removed ${removedCount} invalid cart items`);
          toast({
            title: 'Cart Updated',
            description: `Removed ${removedCount} outdated item${removedCount > 1 ? 's' : ''} from cart`,
            variant: 'destructive',
          });
        }

        return validItems;
      } catch (error) {
        console.error('Error validating cart items:', error);
        // On error, return original items to avoid data loss
        return cartItems;
      }
    },
    [toast]
  );

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadAndValidateCart = async () => {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart) as unknown;
          const cartItems = Array.isArray(parsedCart) ? (parsedCart as CartItem[]) : [];

          // Validate cart items against database
          const validItems = await validateCartItems(cartItems);
          setItems(validItems);
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadAndValidateCart();
  }, [validateCartItems]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [items, isLoading]);

  // Calculate totals with memoization for better performance
  const { subtotal, taxAmount, deliveryFee, totalPrice, totalItems } = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxAmount = subtotal * TAX_RATE;
    const deliveryFee = items.length > 0 ? DEFAULT_DELIVERY_FEE : 0;
    const totalPrice = subtotal + taxAmount + deliveryFee;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return { subtotal, taxAmount, deliveryFee, totalPrice, totalItems };
  }, [items]);

  const addItem = useCallback(
    (product: Product, variant: ProductVariant, quantity = 1) => {
      setItems((currentItems) => {
        // Check if item already exists in cart
        const existingItemIndex = currentItems.findIndex(
          (item) => item.productId === product.id && item.variantId === variant.id
        );

        if (existingItemIndex >= 0) {
          // Update quantity of existing item
          const updatedItems = [...currentItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
          };

          toast({
            title: 'Cart Updated',
            description: `Updated ${product.name} quantity`,
          });

          return updatedItems;
        } else {
          // Add new item to cart
          const newItem: CartItem = {
            id: `${product.id}-${variant.id}-${Date.now()}`,
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            price: variant.price / 100, // Convert from cents to dollars
            quantity,
            image: product.image_url || '/placeholder.svg',
            variant: {
              name: variant.name,
              weight_grams: variant.weight_grams,
            },
            category: product.category,
          };

          toast({
            title: 'Added to Cart',
            description: `${product.name} (${variant.name})`,
          });

          return [...currentItems, newItem];
        }
      });
    },
    [toast]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      setItems((currentItems) => {
        const removedItem = currentItems.find((item) => item.id === itemId);

        if (removedItem) {
          toast({
            title: 'Removed from Cart',
            description: removedItem.name,
          });
        }

        return currentItems.filter((item) => item.id !== itemId);
      });
    },
    [toast]
  );

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(itemId);
        return;
      }

      setItems((currentItems) =>
        currentItems.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    toast({
      title: 'Cart Cleared',
      description: 'All items removed from cart',
    });
  }, [toast]);

  const value: CartContextType = useMemo(
    () => ({
      items,
      totalItems,
      totalPrice,
      subtotal,
      taxAmount,
      deliveryFee,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      isLoading,
    }),
    [
      items,
      totalItems,
      totalPrice,
      subtotal,
      taxAmount,
      deliveryFee,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      isLoading,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
