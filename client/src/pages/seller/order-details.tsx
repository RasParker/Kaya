
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, MapPin, User, Phone, Clock } from "lucide-react";
import type { Order, OrderItem, Product } from "@shared/schema";

interface OrderWithDetails extends Order {
  buyer?: any;
  kayayo?: any;
  rider?: any;
}

export default function SellerOrderDetails() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/seller/order/:orderId");
  const { user } = useAuth();

  const { data: order, isLoading } = useQuery<OrderWithDetails>({
    queryKey: [`/api/orders/${params?.orderId}`],
    enabled: !!params?.orderId,
  });

  const { data: orderItems = [], isLoading: itemsLoading } = useQuery<(OrderItem & { product: Product })[]>({
    queryKey: [`/api/orders/${params?.orderId}/items`],
    enabled: !!params?.orderId,
  });

  if (!user || user.userType !== 'seller') {
    setLocation('/login');
    return null;
  }

  if (isLoading || itemsLoading) {
    return (
      <MobileLayout>
        <div className="p-4 text-center">
          <p>Loading order details...</p>
        </div>
      </MobileLayout>
    );
  }

  if (!order) {
    return (
      <MobileLayout>
        <div className="p-4 text-center">
          <p>Order not found</p>
          <Button onClick={() => setLocation('/seller/orders')} className="mt-4">
            Back to Orders
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/seller/orders")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Order Details</h1>
            <p className="text-sm text-muted-foreground">#{order.id.slice(0, 8)}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20 space-y-4">
        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Order Status</span>
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace('_', ' ')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Placed:</span>
              <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold text-primary">₵{parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{order.buyer?.name || 'N/A'}</p>
            </div>
            {order.buyer?.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {order.buyer.phone}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{order.deliveryAddress}</p>
            </div>
            {order.deliveryInstructions && (
              <div>
                <p className="text-sm text-muted-foreground">Instructions</p>
                <p className="font-medium">{order.deliveryInstructions}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium capitalize">{order.paymentMethod || 'Cash'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="flex gap-3 border-b pb-3 last:border-0">
                  {item.product?.image && (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product?.name || 'Unknown Product'}</h3>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × ₵{parseFloat(item.unitPrice).toFixed(2)}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1">Note: {item.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      ₵{parseFloat(item.subtotal).toFixed(2)}
                    </p>
                    {item.isConfirmed && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Confirmed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kayayo & Rider Info */}
        {(order.kayayo || order.rider) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Providers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.kayayo && (
                <div>
                  <p className="text-sm text-muted-foreground">Kayayo</p>
                  <p className="font-medium">{order.kayayo.name}</p>
                  {order.kayayo.phone && (
                    <p className="text-sm text-muted-foreground">{order.kayayo.phone}</p>
                  )}
                </div>
              )}
              {order.rider && (
                <div>
                  <p className="text-sm text-muted-foreground">Rider</p>
                  <p className="font-medium">{order.rider.name}</p>
                  {order.rider.phone && (
                    <p className="text-sm text-muted-foreground">{order.rider.phone}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </MobileLayout>
  );
}
