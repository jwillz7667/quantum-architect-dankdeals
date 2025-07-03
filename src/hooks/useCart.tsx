import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Product, ProductVariant } from '@/hooks/useProducts';

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

interface CartContextType {
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

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'dankdeals_cart';
const TAX_RATE = 0.1025; // Minnesota cannabis tax rate (example)
const DEFAULT_DELIVERY_FEE = 5.00;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setItems(Array.isArray(parsedCart) ? parsedCart : []);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = subtotal * TAX_RATE;
  const deliveryFee = items.length > 0 ? DEFAULT_DELIVERY_FEE : 0;
  const totalPrice = subtotal + taxAmount + deliveryFee;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = (product: Product, variant: ProductVariant, quantity = 1) => {
    setItems(currentItems => {
      // Check if item already exists in cart
      const existingItemIndex = currentItems.findIndex(
        item => item.productId === product.id && item.variantId === variant.id
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        
        toast({
          title: "Cart Updated",
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
            weight_grams: variant.weight_grams
          },
          category: product.category
        };

        toast({
          title: "Added to Cart",
          description: `${product.name} (${variant.name})`,
        });

        return [...currentItems, newItem];
      }
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setItems(currentItems => {
      const removedItem = currentItems.find(item => item.id === itemId);
      
      if (removedItem) {
        toast({
          title: "Removed from Cart",
          description: removedItem.name,
        });
      }
      
      return currentItems.filter(item => item.id !== itemId);
    });
  };

  const clearCart = () => {
    setItems([]);
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart",
    });
  };

  const value: CartContextType = {
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
    isLoading
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 