import { useEffect, useState } from "react";
import { useLocation, useRoute, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Clock, AlertCircle, User, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MobileLayout from "@/components/layout/mobile-layout";
import type { Order, User as UserType } from "@shared/schema";

interface OrderWithDetails extends Order {
  buyer: UserType;
  kayayo: UserType;
}

export default function OrderConfirmationPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/buyer/order-confirmation");
  const searchString = useSearch();
  const orderId = new URLSearchParams(searchString).get("orderId");

  // Get order details
  const { data: order, isLoading, error } = useQuery<OrderWithDetails>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "yellow";
      case "seller_confirmed": return "blue";
      case "kayayo_accepted": return "blue";
      case "shopping": return "blue";
      case "ready_for_pickup": return "green";
      case "in_transit": return "blue";
      case "delivered": return "green";
      case "cancelled": return "red";
      default: return "gray";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "seller_confirmed": return <CheckCircle className="h-4 w-4" />;
      case "kayayo_accepted": return <User className="h-4 w-4" />;
      case "shopping": return <Package className="h-4 w-4" />;
      case "ready_for_pickup": return <CheckCircle className="h-4 w-4" />;
      case "in_transit": return <Truck className="h-4 w-4" />;
      case "delivered": return <CheckCircle className="h-4 w-4" />;
      case "cancelled": return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending": return "Waiting for seller acceptance";
      case "seller_confirmed": return "Order accepted by sellers";
      case "kayayo_accepted": return "Kayayo assigned to your order";
      case "shopping": return "Kayayo is shopping for your items";
      case "ready_for_pickup": return "Items ready for pickup";
      case "in_transit": return "Order picked up by rider";
      case "delivered": return "Order delivered successfully";
      case "cancelled": return "Order was cancelled";
      default: return "Processing your order";
    }
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="p-4">
          <h1 className="text-lg font-semibold mb-4">Order Confirmation</h1>
          <p>Loading order details...</p>
        </div>
      </MobileLayout>
    );
  }

  if (error || !order) {
    return (
      <MobileLayout>
        <div className="p-4">
          <h1 className="text-lg font-semibold mb-4">Order Confirmation</h1>
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-lg font-semibold">Order not found</h2>
            <p className="text-muted-foreground">
              We couldn't find this order. It may have been cancelled or the link is invalid.
            </p>
            <Button onClick={() => setLocation("/buyer/orders")} className="w-full" data-testid="button-view-orders-error">
              View All Orders
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/buyer/orders")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Order Confirmation</h1>
          <p className="text-sm text-muted-foreground">Order #{order.id.slice(-8)}</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(order.status)}
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="outline">
                  {order.status.replace("_", " ").toUpperCase()}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {getStatusMessage(order.status)}
                </p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${["pending", "seller_confirmed", "kayayo_accepted", "shopping", "ready_for_pickup", "in_transit", "delivered"].includes(order.status) ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-sm">Order placed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${["seller_confirmed", "kayayo_accepted", "shopping", "ready_for_pickup", "in_transit", "delivered"].includes(order.status) ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-sm">Sellers accepted</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${["kayayo_accepted", "shopping", "ready_for_pickup", "in_transit", "delivered"].includes(order.status) ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-sm">Kayayo assigned</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${["shopping", "ready_for_pickup", "in_transit", "delivered"].includes(order.status) ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-sm">Kayayo shopping</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${["ready_for_pickup", "in_transit", "delivered"].includes(order.status) ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-sm">Ready for pickup</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${["in_transit", "delivered"].includes(order.status) ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-sm">Out for delivery</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${order.status === "delivered" ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-sm">Delivered</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kayayo Information */}
        {order.kayayo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Kayayo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{order.kayayo.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ⭐ {parseFloat(order.kayayo.rating || "0").toFixed(1)} rating
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{order.deliveryAddress}</p>
          </CardContent>
        </Card>

        {/* Payment & Total */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Kayayo Fee</span>
              <span>₵{parseFloat(order.kayayoFee || "0").toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery Fee</span>
              <span>₵{parseFloat(order.deliveryFee || "0").toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Platform Fee</span>
              <span>₵{parseFloat(order.platformFee || "0").toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Paid</span>
              <span>₵{parseFloat(order.totalAmount || "0").toFixed(2)}</span>
            </div>
            {order.paymentMethod && (
              <p className="text-sm text-muted-foreground">
                Payment method: {order.paymentMethod === "momo" ? "Mobile Money" : order.paymentMethod === "card" ? "Card" : "Cash on Delivery"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {order.status === "pending" && (
            <Button 
              variant="outline" 
              className="w-full"
              data-testid="button-cancel-order"
            >
              Cancel Order
            </Button>
          )}
          
          <Button 
            onClick={() => setLocation("/buyer/orders")}
            className="w-full"
            data-testid="button-view-orders"
          >
            View All Orders
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}