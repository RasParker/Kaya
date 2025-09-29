import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Smartphone, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import MobileLayout from "@/components/layout/mobile-layout";
import { apiRequest } from "@/lib/queryClient";
import type { CartItem, Product, User as UserType, InsertOrder } from "@shared/schema";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "momo",
    name: "Mobile Money",
    icon: <Smartphone className="h-5 w-5" />,
    description: "MTN MoMo, Vodafone Cash, AirtelTigo"
  },
  {
    id: "card",
    name: "Debit/Credit Card", 
    icon: <CreditCard className="h-5 w-5" />,
    description: "Visa, Mastercard"
  },
  {
    id: "cash",
    name: "Cash on Delivery",
    icon: <Banknote className="h-5 w-5" />,
    description: "Pay when your order arrives"
  }
];

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get user info
  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/auth/me"],
  });

  // Get cart items
  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
  });

  // Get kayayo and delivery info from localStorage (passed from cart)
  const checkoutData = JSON.parse(localStorage.getItem("checkoutData") || "{}");
  const { selectedKayayo, deliveryAddress, kayayoFee, deliveryFee, platformFee } = checkoutData;

  // Calculate totals
  const itemsTotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.product?.price || "0") * item.quantity), 0);
  const grandTotal = itemsTotal + (kayayoFee || 0) + (deliveryFee || 0) + (platformFee || 0);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: InsertOrder) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (order) => {
      // Clear cart and checkout data
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      localStorage.removeItem("checkoutData");
      
      toast({
        title: "Order placed successfully!",
        description: "Your order has been submitted to the sellers.",
      });
      
      // Navigate to order confirmation
      setLocation(`/buyer/order-confirmation?orderId=${order.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to place order",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmOrder = () => {
    if (!selectedPayment) {
      toast({
        title: "Select payment method",
        description: "Please choose how you'd like to pay for your order.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedKayayo || !deliveryAddress) {
      toast({
        title: "Missing checkout data",
        description: "Please go back to cart and complete the checkout process.",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate({
      buyerId: user?.id || "",
      kayayoId: selectedKayayo,
      totalAmount: grandTotal.toFixed(2),
      deliveryAddress: deliveryAddress.trim(),
      deliveryFee: (deliveryFee || 0).toFixed(2),
      kayayoFee: (kayayoFee || 0).toFixed(2),
      platformFee: (platformFee || 0).toFixed(2),
      status: "pending",
      paymentMethod: selectedPayment,
    });
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="p-4">
          <h1 className="text-lg font-semibold mb-4">Loading...</h1>
          <p>Loading payment options...</p>
        </div>
      </MobileLayout>
    );
  }

  if (!checkoutData.selectedKayayo) {
    return (
      <MobileLayout>
        <div className="p-4">
          <h1 className="text-lg font-semibold mb-4">Payment</h1>
          <p className="text-center text-muted-foreground">
            No checkout data found. Please return to cart and try again.
          </p>
          <Button onClick={() => setLocation("/cart")} className="w-full mt-4" data-testid="button-return-cart">
            Return to Cart
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/cart")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Choose Payment Method</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Items ({cartItems.length})</span>
              <span>₵{itemsTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Kayayo Fee</span>
              <span>₵{(kayayoFee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery Fee</span>
              <span>₵{(deliveryFee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Platform Fee</span>
              <span>₵{(platformFee || 0).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₵{grandTotal.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery Address</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{deliveryAddress}</p>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value={method.id} id={method.id} data-testid={`radio-payment-${method.id}`} />
                  <div className="flex-1">
                    <Label htmlFor={method.id} className="flex items-center gap-2 cursor-pointer" data-testid={`label-payment-${method.id}`}>
                      {method.icon}
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-xs text-muted-foreground">{method.description}</div>
                      </div>
                    </Label>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Order Button */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
        <Button
          className="w-full h-12 text-lg font-semibold"
          onClick={handleConfirmOrder}
          disabled={createOrderMutation.isPending || !selectedPayment}
          data-testid="button-confirm-order"
        >
          {createOrderMutation.isPending 
            ? "Placing Order..." 
            : !selectedPayment
              ? "Select Payment Method"
              : `Confirm Order - ₵${grandTotal.toFixed(2)}`
          }
        </Button>
      </div>
    </MobileLayout>
  );
}