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
