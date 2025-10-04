import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Star,
  Navigation,
  Package,
  DollarSign
} from "lucide-react";

export default function RiderDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  const { toast } = useToast();

  const { data: orders = [] } = useQuery({
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

  const activeDeliveries = orders.filter((order: any) => 
    order.riderId === user.id && order.status === 'in_transit'
  );

  const availableDeliveries = orders.filter((order: any) => 
    !order.riderId && order.status === 'ready_for_pickup'
  );

  const completedDeliveries = orders.filter((order: any) => 
    order.riderId === user.id && order.status === 'delivered'
  );

  // Calculate today's earnings
  const todayDeliveries = completedDeliveries.filter((order: any) => {
    const orderDate = new Date(order.deliveredAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });
  
  const todayEarnings = todayDeliveries.reduce((sum: number, order: any) => {
    return sum + parseFloat(order.deliveryFee || 0);
  }, 0);

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-primary" data-testid="rider-dashboard-title">
              Rider Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-xs text-muted-foreground">
              {user.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-lg font-bold text-primary" data-testid="today-earnings">
                ₵{todayEarnings.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="bg-secondary/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-4 w-4 text-secondary" />
              <span className="text-lg font-bold text-secondary" data-testid="rider-rating">
                {parseFloat(user.rating).toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
          <div className="bg-accent/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Truck className="h-4 w-4 text-accent" />
              <span className="text-lg font-bold text-accent" data-testid="total-deliveries">
                {user.totalOrders}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Deliveries</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20 space-y-4">
        {/* Active Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Active Deliveries ({activeDeliveries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <Navigation className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No active deliveries</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeDeliveries.map((order: any) => (
                  <ActiveDeliveryCard 
                    key={order.id} 
                    order={order} 
                    onComplete={() => completeDeliveryMutation.mutate(order.id)}
                    isCompleting={completeDeliveryMutation.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Available Deliveries ({availableDeliveries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No deliveries available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableDeliveries.slice(0, 5).map((order: any) => (
                  <AvailableDeliveryCard 
                    key={order.id} 
                    order={order} 
                    onAccept={() => acceptDeliveryMutation.mutate(order.id)}
                    isAccepting={acceptDeliveryMutation.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completed Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Completed Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            {completedDeliveries.slice(0, 5).length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No completed deliveries yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedDeliveries.slice(0, 5).map((order: any) => (
                  <CompletedDeliveryCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-bold">{parseFloat(user.rating).toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Average Rating</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="font-bold">{user.totalOrders}</span>
                </div>
                <p className="text-xs text-muted-foreground">Total Deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </MobileLayout>
  );
}

function ActiveDeliveryCard({ order, onComplete, isCompleting }: any) {
  return (
    <div 
      className="border rounded-lg p-3 bg-blue-50 border-blue-200"
      data-testid={`active-delivery-${order.id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Order #{order.id.slice(0, 8)}</h3>
        <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>
      </div>
      <div className="space-y-1 text-sm mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Deliver to: {order.deliveryAddress}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Delivery fee:</span>
          <span className="font-semibold text-primary">₵{parseFloat(order.deliveryFee || 0).toFixed(2)}</span>
        </div>
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
    </div>
  );
}

function AvailableDeliveryCard({ order, onAccept, isAccepting }: any) {
  return (
    <div 
      className="border rounded-lg p-3"
      data-testid={`available-delivery-${order.id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Order #{order.id.slice(0, 8)}</h3>
        <span className="text-sm font-semibold text-primary">
          ₵{parseFloat(order.deliveryFee || 0).toFixed(2)} fee
        </span>
      </div>
      <div className="space-y-1 text-sm mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Deliver to: {order.deliveryAddress}</span>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Order total: ₵{parseFloat(order.totalAmount).toFixed(2)}</span>
        </div>
        {order.estimatedDeliveryTime && (
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Est. {order.estimatedDeliveryTime} minutes</span>
          </div>
        )}
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
    </div>
  );
}

function CompletedDeliveryCard({ order }: any) {
  return (
    <div 
      className="border rounded-lg p-3"
      data-testid={`completed-delivery-${order.id}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Order #{order.id.slice(0, 8)}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(order.deliveredAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <span className="font-semibold text-primary">₵{parseFloat(order.deliveryFee || 0).toFixed(2)}</span>
          <Badge className="block mt-1 bg-green-100 text-green-800">Delivered</Badge>
        </div>
      </div>
    </div>
  );
}
