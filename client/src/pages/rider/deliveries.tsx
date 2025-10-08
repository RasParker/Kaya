import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { apiRequest } from "@/lib/queryClient";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Package,
  DollarSign,
  Navigation,
  ArrowLeft
} from "lucide-react";
import type { Order } from "@shared/schema";

export default function RiderDeliveries() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const acceptDeliveryMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, {
        status: "in_transit",
        riderId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Delivery accepted",
        description: "You have accepted this delivery order.",
      });
    },
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, {
        status: "delivered",
        deliveredAt: new Date().toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Delivery completed",
        description: "Order has been marked as delivered.",
      });
    },
  });

  if (!user || user.userType !== 'rider') {
    setLocation('/login');
    return null;
  }

  const activeDeliveries = Array.isArray(orders) ? orders.filter((order: Order) => 
    order.riderId === user.id && order.status === 'in_transit'
  ) : [];

  const availableDeliveries = Array.isArray(orders) ? orders.filter((order: Order) => 
    !order.riderId && order.status === 'ready_for_pickup'
  ) : [];

  const completedDeliveries = Array.isArray(orders) ? orders.filter((order: Order) => 
    order.riderId === user.id && order.status === 'delivered'
  ) : [];

  return (
    <MobileLayout>
      <header className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/rider/dashboard')}
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-primary" data-testid="deliveries-page-title">
              My Deliveries
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage all your delivery orders
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 rounded-lg p-2">
            <p className="text-lg font-bold text-blue-900" data-testid="count-active">{activeDeliveries.length}</p>
            <p className="text-xs text-blue-700">Active</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2">
            <p className="text-lg font-bold text-yellow-900" data-testid="count-available">{availableDeliveries.length}</p>
            <p className="text-xs text-yellow-700">Available</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <p className="text-lg font-bold text-green-900" data-testid="count-completed">{completedDeliveries.length}</p>
            <p className="text-xs text-green-700">Completed</p>
          </div>
        </div>
      </header>

      <main className="p-4 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="active" data-testid="tab-active">
              Active ({activeDeliveries.length})
            </TabsTrigger>
            <TabsTrigger value="available" data-testid="tab-available">
              Available ({availableDeliveries.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed ({completedDeliveries.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading deliveries...</p>
              </div>
            ) : activeDeliveries.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Navigation className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No active deliveries</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Accept deliveries from the Available tab
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeDeliveries.map((order) => (
                <ActiveDeliveryCard 
                  key={order.id} 
                  order={order} 
                  onComplete={() => completeDeliveryMutation.mutate(order.id)}
                  isCompleting={completeDeliveryMutation.isPending}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading deliveries...</p>
              </div>
            ) : availableDeliveries.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No available deliveries</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check back later for new delivery requests
                  </p>
                </CardContent>
              </Card>
            ) : (
              availableDeliveries.map((order) => (
                <AvailableDeliveryCard 
                  key={order.id} 
                  order={order} 
                  onAccept={() => acceptDeliveryMutation.mutate(order.id)}
                  isAccepting={acceptDeliveryMutation.isPending}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading deliveries...</p>
              </div>
            ) : completedDeliveries.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No completed deliveries yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your delivery history will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedDeliveries.map((order) => (
                <CompletedDeliveryCard key={order.id} order={order} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </MobileLayout>
  );
}

function ActiveDeliveryCard({ order, onComplete, isCompleting }: any) {
  // Generate a simple 4-digit verification code based on order ID
  const verificationCode = order.id.slice(0, 4).split('').map((char: string) => {
    const code = char.charCodeAt(0);
    return (code % 10).toString();
  }).join('');

  return (
    <Card 
      className="border-blue-200 bg-blue-50"
      data-testid={`active-delivery-${order.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Order #{order.id.slice(0, 8)}</CardTitle>
          <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{order.deliveryAddress}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Delivery fee:</span>
            <span className="font-semibold text-primary">₵{parseFloat(order.deliveryFee || 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Order total:</span>
            <span className="font-semibold">₵{parseFloat(order.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>
        <div className="bg-white border border-blue-300 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Your Pickup Code was:</p>
          <p className="text-2xl font-bold text-blue-900 tracking-widest text-center">{verificationCode}</p>
        </div>
        <Button 
          size="sm" 
          className="w-full"
          onClick={onComplete}
          disabled={isCompleting}
          data-testid={`button-complete-${order.id}`}
        >
          {isCompleting ? 'Completing...' : 'Mark as Delivered'}
        </Button>
      </CardContent>
    </Card>
  );
}

function AvailableDeliveryCard({ order, onAccept, isAccepting }: any) {
  // Generate a simple 4-digit verification code based on order ID
  const verificationCode = order.id.slice(0, 4).split('').map((char: string) => {
    const code = char.charCodeAt(0);
    return (code % 10).toString();
  }).join('');

  return (
    <Card data-testid={`available-delivery-${order.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Order #{order.id.slice(0, 8)}</CardTitle>
          <span className="text-sm font-semibold text-primary">
            ₵{parseFloat(order.deliveryFee || 0).toFixed(2)} fee
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{order.deliveryAddress}</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Order total: ₵{parseFloat(order.totalAmount || 0).toFixed(2)}</span>
          </div>
          {order.estimatedDeliveryTime && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Est. {order.estimatedDeliveryTime} minutes</span>
            </div>
          )}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Your Pickup Code:</p>
          <p className="text-2xl font-bold text-blue-900 tracking-widest text-center">{verificationCode}</p>
          <p className="text-xs text-muted-foreground mt-1">Share this with kayayo during pickup</p>
        </div>
        <Button 
          size="sm" 
          className="w-full"
          onClick={onAccept}
          disabled={isAccepting}
          data-testid={`button-accept-delivery-${order.id}`}
        >
          {isAccepting ? 'Accepting...' : 'Accept Delivery'}
        </Button>
      </CardContent>
    </Card>
  );
}

function CompletedDeliveryCard({ order }: any) {
  return (
    <Card data-testid={`completed-delivery-${order.id}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
            <p className="text-sm text-muted-foreground">
              {order.deliveryAddress}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(order.deliveredAt).toLocaleDateString()} at {new Date(order.deliveredAt).toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary">₵{parseFloat(order.deliveryFee || 0).toFixed(2)}</span>
            </div>
            <Badge className="bg-green-100 text-green-800">Delivered</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
