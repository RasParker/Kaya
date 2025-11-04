import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  MapPin, 
  Package, 
  User, 
  Phone, 
  Clock,
  Bike,
  CheckCircle,
  Eye,
  Navigation
} from "lucide-react";
import type { Order, OrderItem, Product } from "@shared/schema";

interface OrderWithDetails extends Order {
  buyer?: any;
  kayayo?: any;
  rider?: any;
}

export default function RiderOrderDetails() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/rider/order/:orderId");
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showPickupCodeDialog, setShowPickupCodeDialog] = useState(false);

  const { data: order, isLoading } = useQuery<OrderWithDetails>({
    queryKey: [`/api/orders/${params?.orderId}`],
    enabled: !!params?.orderId,
  });

  const { data: orderItems = [], isLoading: itemsLoading } = useQuery<(OrderItem & { product: Product })[]>({
    queryKey: [`/api/orders/${params?.orderId}/items`],
    enabled: !!params?.orderId,
  });

  const { data: pickupCodeData } = useQuery<{ pickupCode: string }>({
    queryKey: [`/api/orders/${params?.orderId}/rider-pickup-code`],
    enabled: !!params?.orderId && !!order?.riderId,
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/orders/${order?.id}`, {
        status: "delivered",
        deliveredAt: new Date().toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${params?.orderId}`] });
      toast({
        title: "Delivery completed",
        description: "Order has been marked as delivered.",
      });
      setLocation('/rider/deliveries');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to complete delivery",
        description: error.message || "Failed to complete delivery",
        variant: "destructive",
      });
    },
  });

  if (!user || user.userType !== 'rider') {
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
          <Button onClick={() => setLocation('/rider/deliveries')} className="mt-4">
            Back to Deliveries
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_for_pickup':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const isReadyForPickup = order.status === 'ready_for_pickup';
  const isInTransit = order.status === 'in_transit';
  const isDelivered = order.status === 'delivered';

  return (
    <MobileLayout>
      <header className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/rider/deliveries")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Delivery Details</h1>
            <p className="text-sm text-muted-foreground">#{order.id.slice(0, 8)}</p>
          </div>
        </div>
      </header>

      <main className="p-4 pb-20 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Delivery Status</span>
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace(/_/g, ' ')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Order Placed:</span>
              <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Order Total:</span>
              <span className="font-bold text-primary">₵{parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Bike className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Your Fee:</span>
              <span className="font-bold text-primary">₵{parseFloat(order.deliveryFee || "0").toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {isReadyForPickup && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Pickup from Kayayo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.kayayo && (
                <div className="bg-white dark:bg-gray-900 border rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-1">Kayayo</p>
                  <p className="font-medium">{order.kayayo.name}</p>
                  {order.kayayo.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {order.kayayo.phone}
                    </p>
                  )}
                </div>
              )}
              
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Instructions:</p>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Show your pickup code to the Kayayo</li>
                  <li>Kayayo will verify and hand over items</li>
                  <li>Confirm you received all items</li>
                  <li>Start delivery to customer</li>
                </ol>
              </div>

              <Button
                className="w-full"
                onClick={() => setShowPickupCodeDialog(true)}
                data-testid="button-show-pickup-code"
              >
                <Eye className="h-4 w-4 mr-2" />
                Show My Pickup Code
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{order.deliveryAddress}</p>
            {(order as any).deliveryInstructions && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">Special Instructions:</p>
                <p className="text-sm text-muted-foreground">{(order as any).deliveryInstructions}</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                toast({
                  title: "Navigation",
                  description: "Opening maps for navigation",
                });
              }}
              data-testid="button-navigate"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navigate to Address
            </Button>
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Items ({orderItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="flex gap-3 border-b pb-3 last:border-0" data-testid={`order-item-${item.id}`}>
                  {item.product?.image && (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                      data-testid={`img-product-${item.id}`}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold" data-testid={`text-product-name-${item.id}`}>
                      {item.product?.name || 'Unknown Product'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × ₵{parseFloat(item.unitPrice).toFixed(2)}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1">Note: {item.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary" data-testid={`text-subtotal-${item.id}`}>
                      ₵{parseFloat(item.subtotal).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {isInTransit && (
          <Button
            className="w-full h-12 bg-green-600 hover:bg-green-700"
            onClick={() => completeDeliveryMutation.mutate()}
            disabled={completeDeliveryMutation.isPending}
            data-testid="button-complete-delivery"
          >
            {completeDeliveryMutation.isPending ? 'Processing...' : 'Mark Delivery Complete'}
          </Button>
        )}

        {isDelivered && (
          <div className="text-center py-8 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Delivery Completed!</h3>
            <p className="text-muted-foreground">Great job on completing this delivery</p>
          </div>
        )}
      </main>

      <Dialog open={showPickupCodeDialog} onOpenChange={setShowPickupCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Pickup Code</DialogTitle>
            <DialogDescription>
              Show this code to the Kayayo when collecting items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
              <p className="text-xs text-muted-foreground mb-3 text-center">Your Pickup Code:</p>
              <p className="text-5xl font-bold text-primary tracking-widest text-center" data-testid="text-pickup-code">
                {pickupCodeData?.pickupCode || '000000'}
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Next Steps:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Show this code to the Kayayo</li>
                <li>Kayayo will verify your identity</li>
                <li>Collect all items from the Kayayo</li>
                <li>Proceed to deliver to customer</li>
              </ol>
            </div>
            
            <Button
              className="w-full"
              onClick={() => setShowPickupCodeDialog(false)}
              data-testid="button-close-code"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
