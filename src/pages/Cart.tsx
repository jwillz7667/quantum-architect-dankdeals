import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import blueDreamImg from "@/assets/blue-dream.jpg";
import prerollsImg from "@/assets/prerolls.jpg";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  type: string;
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "1",
      name: "Blue Dream",
      price: 25.50,
      quantity: 2,
      image: blueDreamImg,
      type: "Hybrid"
    },
    {
      id: "2",
      name: "Pacific Prerolls",
      price: 65.40,
      quantity: 1,
      image: prerollsImg,
      type: "Hybrid"
    }
  ]);

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-background pb-32 animate-fade-in">
      {/* Header */}
      <div className="bg-primary px-4 py-6 text-center">
        <h1 className="text-2xl font-bold text-primary-foreground">
          Shopping Cart
        </h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground">Add some products to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="product-card p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                    <p className="text-lg font-bold text-primary">${item.price.toFixed(2)}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-8 w-8 rounded-full"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-8 w-8 rounded-full"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
            </div>
            <Button variant="cannabis" className="w-full h-12 text-lg">
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}