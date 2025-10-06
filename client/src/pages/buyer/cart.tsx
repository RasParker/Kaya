import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { apiRequest } from "@/lib/queryClient";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, MapPin, Clock, Star, User } from "lucide-react";
import type { CartItem, Product, Seller, User as UserType, InsertOrder } from "@shared/schema";

type CartItemWithProduct = CartItem & { product: Product };
type SellerWithUser = Seller & { user: UserType };
type KayayoWithUser = { user: UserType; isAvailable: boolean; currentLocation: string; rating: string; totalOrders: number };

export default function Cart() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [deliveryAddress, setDeliveryAddress] = useState("123 Main Street, Accra");
  const [allowSubstitutions, setAllowSubstitutions] = useState(true);
  const [selectedKayayo, setSelectedKayayo] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  
  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const { data: availableKayayos = [] } = useQuery<KayayoWithUser[]>({
    queryKey: ["/api/kayayos/available"],
    enabled: !!user && cartItems.length > 0,
  });

  const updateCartMutation = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: Partial<CartItem> }) => {
      setUpdatingItemId(itemId);
      const response = await apiRequest("PATCH", `/api/cart/${itemId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setUpdatingItemId(null);
    },
    onError: () => {
      setUpdatingItemId(null);
    },
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

  // Remove createOrderMutation since we now navigate to payment page

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.product?.price || '0') * item.quantity);
    }, 0);
  };

  const calculateFees = () => {
    const itemsTotal = calculateTotal();
    const kayayoFee = 3.00;
    const deliveryFee = itemsTotal > 50 ? 0 : 5.00; // Free delivery over ₵50
    const platformFee = Math.max(1.00, itemsTotal * 0.02); // 2% or minimum ₵1
    return { kayayoFee, deliveryFee, platformFee };
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartMutation.mutate({ itemId, updates: { quantity: newQuantity } });
  };

  const handleSubstitutionToggle = (itemId: string, allowSubstitution: boolean) => {
    updateCartMutation.mutate({ itemId, updates: { allowSubstitution } });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0 || !selectedKayayo || !deliveryAddress.trim()) {
      toast({
        title: "Cannot proceed",
        description: "Please select a Kayayo and enter your delivery address.",
        variant: "destructive",
      });
      return;
    }

    const { kayayoFee, deliveryFee, platformFee } = calculateFees();

    // Save checkout data to localStorage for payment page
    const checkoutData = {
      selectedKayayo,
      deliveryAddress: deliveryAddress.trim(),
      kayayoFee,
      deliveryFee,
      platformFee,
    };
    
    localStorage.setItem("checkoutData", JSON.stringify(checkoutData));
    
    // Navigate to payment page
    setLocation("/buyer/payment");
  };

  // Group cart items by seller and fetch seller data
  const { data: sellers = [] } = useQuery<SellerWithUser[]>({
    queryKey: ["/api/sellers"],
    enabled: cartItems.length > 0,
  });

  const groupedItems = cartItems.reduce((groups: Record<string, { items: CartItemWithProduct[], seller?: SellerWithUser }>, item) => {
    const sellerId = item.product?.sellerId || 'unknown';
    if (!groups[sellerId]) {
      const seller = sellers.find(s => s.id === sellerId);
      groups[sellerId] = { items: [], seller };
    }
    groups[sellerId].items.push(item);
    return groups;
  }, {} as Record<string, { items: CartItemWithProduct[], seller?: SellerWithUser }>);

  const totalSellers = Object.keys(groupedItems).length;
  const { kayayoFee, deliveryFee, platformFee } = calculateFees();
  const itemsTotal = calculateTotal();
  const grandTotal = itemsTotal + kayayoFee + deliveryFee + platformFee;

  if (isLoading) {
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

        <div className="p-4 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border p-4">
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
          <div className="space-y-6">
            {/* Multi-seller notice */}
            {totalSellers > 1 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-blue-800">
                    📦 This order needs items from {totalSellers} sellers. A Kayayo will shop them for you.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Cart Items grouped by seller */}
            {Object.entries(groupedItems).map(([sellerId, { items, seller }]) => (
              <Card key={sellerId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-sm">
                        {seller?.stallName || `Seller ${sellerId.slice(0, 8)}`}
                      </CardTitle>
                      {seller && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">
                              {parseFloat(seller.user.rating || "0").toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {seller.stallLocation}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <EnhancedCartItemRow 
                      key={item.id} 
                      item={item} 
                      onQuantityChange={handleQuantityChange}
                      onSubstitutionToggle={handleSubstitutionToggle}
                      onRemove={() => removeFromCartMutation.mutate(item.id)}
                      isUpdating={updatingItemId === item.id}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your delivery address"
                  className="mb-3"
                  data-testid="input-delivery-address"
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="substitutions"
                    checked={allowSubstitutions}
                    onCheckedChange={(checked) => {
                      const newValue = checked as boolean;
                      setAllowSubstitutions(newValue);
                      // Apply to all cart items
                      cartItems.forEach(item => {
                        handleSubstitutionToggle(item.id, newValue);
                      });
                    }}
                  />
                  <Label htmlFor="substitutions" className="text-sm">
                    Allow substitutions for all items if unavailable
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Kayayo Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Your Kayayo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose a market assistant to shop for you
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableKayayos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Finding available Kayayos...
                  </p>
                ) : (
                  availableKayayos.map((kayayo) => (
                    <div
                      key={kayayo.user.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedKayayo === kayayo.user.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedKayayo(kayayo.user.id)}
                      data-testid={`card-kayayo-${kayayo.user.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{kayayo.user.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span>{parseFloat(kayayo.user.rating || "0").toFixed(1)}</span>
                              </div>
                              <span>•</span>
                              <span>{kayayo.user.totalOrders} orders</span>
                              <span>•</span>
                              <span>{kayayo.currentLocation}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">₵{kayayoFee.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Shopping fee</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Items Total</span>
                  <span data-testid="text-items-total">₵{itemsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kayayo Fee</span>
                  <span>₵{kayayoFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="flex items-center gap-1">
                    ₵{deliveryFee.toFixed(2)}
                    {deliveryFee === 0 && (
                      <Badge variant="secondary" className="text-xs">FREE</Badge>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span>₵{platformFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary" data-testid="text-total-amount">
                    ₵{grandTotal.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Checkout Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[414px] p-4 bg-background border-t border-border z-50">
          <Button
            className="w-full h-12 text-lg font-semibold shadow-lg"
            onClick={handleCheckout}
            disabled={!selectedKayayo || !deliveryAddress.trim()}
            data-testid="button-checkout"
          >
            {!selectedKayayo 
              ? "Select a Kayayo to Continue"
              : !deliveryAddress.trim()
                ? "Enter Delivery Address"
                : "Proceed to Payment"
            }
          </Button>
        </div>
      )}
    </MobileLayout>
  );
}

function EnhancedCartItemRow({ 
  item, 
  onQuantityChange, 
  onSubstitutionToggle, 
  onRemove, 
  isUpdating 
}: { 
  item: CartItemWithProduct; 
  onQuantityChange: (itemId: string, quantity: number) => void;
  onSubstitutionToggle: (itemId: string, allowSubstitution: boolean) => void;
  onRemove: () => void;
  isUpdating: boolean;
}) {
  const product = item.product;
  
  if (!product) return null;

  const itemTotal = parseFloat(product.price) * item.quantity;

  return (
    <div className="space-y-3" data-testid={`cart-item-${item.id}`}>
      <div className="flex items-start gap-3">
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

        {/* Remove Button */}
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

      {/* Quantity Controls and Substitution */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onQuantityChange(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1 || isUpdating}
            data-testid={`button-decrease-${item.id}`}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-medium w-8 text-center" data-testid={`text-cart-quantity-${item.id}`}>
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            disabled={isUpdating}
            data-testid={`button-increase-${item.id}`}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold">₵{itemTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Substitution Toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`substitution-${item.id}`}
          checked={item.allowSubstitution || false}
          onCheckedChange={(checked) => onSubstitutionToggle(item.id, checked as boolean)}
          disabled={isUpdating}
        />
        <Label htmlFor={`substitution-${item.id}`} className="text-xs text-muted-foreground">
          Allow substitution if unavailable
        </Label>
      </div>
    </div>
  );
}
