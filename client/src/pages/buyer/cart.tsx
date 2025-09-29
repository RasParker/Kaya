import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { apiRequest } from "@/lib/queryClient";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import type { CartItem, Product, InsertOrder } from "@shared/schema";

type CartItemWithProduct = CartItem & { product: Product };

export default function Cart() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("DELETE", `/api/cart/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: InsertOrder) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order placed!",
        description: "Your order has been created successfully.",
      });
      setLocation("/orders");
    },
  });

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.product?.price || '0') * item.quantity);
    }, 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    const total = calculateTotal();
    const deliveryFee = 5.00;
    const kayayoFee = 3.00;
    const platformFee = 1.00;

    createOrderMutation.mutate({
      buyerId: user?.id || "",
      totalAmount: (total + deliveryFee + kayayoFee + platformFee).toFixed(2),
      deliveryAddress: "User Address", // TODO: Get from user profile
      deliveryFee: deliveryFee.toFixed(2),
      kayayoFee: kayayoFee.toFixed(2),
      platformFee: platformFee.toFixed(2),
      status: "pending",
    });
  };

  // Group cart items by seller
  const groupedItems = cartItems.reduce((groups: Record<string, CartItemWithProduct[]>, item) => {
    const sellerId = item.product?.sellerId || 'unknown';
    if (!groups[sellerId]) {
      groups[sellerId] = [];
    }
    groups[sellerId].push(item);
    return groups;
  }, {} as Record<string, CartItemWithProduct[]>);

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="p-4">
          <p className="text-center text-muted-foreground">Loading cart...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Shopping Cart</h1>
        </div>
      </header>

      {/* Cart Content */}
      <main className="p-4 pb-32">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-4">
              Start shopping to add items to your cart
            </p>
            <Button onClick={() => setLocation("/browse")} data-testid="button-start-shopping">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items grouped by seller */}
            {Object.entries(groupedItems).map(([sellerId, items]) => (
              <Card key={sellerId}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    Items from Seller {sellerId.slice(0, 8)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <CartItemRow 
                      key={item.id} 
                      item={item} 
                      onRemove={() => removeFromCartMutation.mutate(item.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Items Total</span>
                  <span data-testid="text-items-total">₵{calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kayayo Fee</span>
                  <span>₵3.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>₵5.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span>₵1.00</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary" data-testid="text-total-amount">
                    ₵{(calculateTotal() + 9.00).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Checkout Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
          <Button
            className="w-full h-12 text-lg font-semibold"
            onClick={handleCheckout}
            disabled={createOrderMutation.isPending}
            data-testid="button-checkout"
          >
            {createOrderMutation.isPending ? "Placing Order..." : "Proceed to Checkout"}
          </Button>
        </div>
      )}
    </MobileLayout>
  );
}

function CartItemRow({ item, onRemove }: { item: CartItemWithProduct; onRemove: () => void }) {
  const product = item.product;
  
  if (!product) return null;

  return (
    <div className="flex items-center gap-3" data-testid={`cart-item-${item.id}`}>
      {/* Product Image */}
      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
            data-testid={`img-cart-product-${item.id}`}
          />
        ) : (
          <span className="text-lg">🥬</span>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1">
        <h3 className="font-semibold text-sm" data-testid={`text-cart-product-name-${item.id}`}>
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground">
          ₵{parseFloat(product.price).toFixed(2)} {product.unit}
        </p>
        {item.notes && (
          <p className="text-xs text-muted-foreground">Note: {item.notes}</p>
        )}
      </div>

      {/* Quantity and Actions */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" data-testid={`text-cart-quantity-${item.id}`}>
          Qty: {item.quantity}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={onRemove}
          data-testid={`button-remove-${item.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
