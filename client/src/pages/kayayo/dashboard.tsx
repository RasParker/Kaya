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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Star,
  Users,
  Package
} from "lucide-react";

export default function KayayoDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  const { toast } = useToast();

  const { data: availability } = useQuery({
    queryKey: ["/api/kayayos", user?.id, "availability"],
    queryFn: async () => {
      const response = await fetch(`/api/kayayos/availability`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      return response.json();
    },
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      const response = await apiRequest("PATCH", `/api/kayayos/${user?.id}/availability`, {
        isAvailable
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kayayos"] });
      toast({
        title: "Availability updated",
        description: isAvailable ? "You are now available for orders" : "You are now unavailable",
      });
    },
  });

  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, {
        status: "kayayo_accepted",
        kayayoId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order accepted",
        description: "You have accepted this shopping order.",
      });
    },
  });

  if (!user || user.userType !== 'kayayo') {
    setLocation('/login');
    return null;
  }

  const activeOrders = orders.filter((order: any) => 
    order.kayayoId === user.id && ['kayayo_accepted', 'shopping'].includes(order.status)
  );

  const completedOrders = orders.filter((order: any) => 
    order.kayayoId === user.id && order.status === 'delivered'
  );

  // Calculate today's earnings
  const todayOrders = completedOrders.filter((order: any) => {
    const orderDate = new Date(order.deliveredAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });
  
  const todayEarnings = todayOrders.reduce((sum: number, order: any) => {
    return sum + parseFloat(order.kayayoFee || 0);
  }, 0);

  const isAvailable = availability?.isAvailable || false;

  return (
    <MobileLayout>
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-primary" data-testid="kayayo-dashboard-title">
              Kayayo Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-muted-foreground">
              {isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
          <div>
            <p className="font-semibold text-sm">Available for Orders</p>
            <p className="text-xs text-muted-foreground">
              Turn on to receive new shopping requests
            </p>
          </div>
          <Switch
            checked={isAvailable}
            onCheckedChange={(checked) => updateAvailabilityMutation.mutate(checked)}
            disabled={updateAvailabilityMutation.isPending}
            data-testid="switch-availability"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary" data-testid="today-earnings">
              ₵{todayEarnings.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="bg-secondary/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-secondary" data-testid="kayayo-rating">
              {parseFloat(user.rating).toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
          <div className="bg-accent/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-accent" data-testid="total-orders">
              {user.totalOrders}
            </p>
            <p className="text-xs text-muted-foreground">Orders</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20 space-y-4">
        {/* Active Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Active Orders ({activeOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {isAvailable ? 'No active orders. New orders will appear here.' : 'Turn on availability to receive orders.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order: any) => (
                  <ActiveOrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Orders */}
        {isAvailable && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Available Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AvailableOrdersList onAccept={(orderId) => acceptOrderMutation.mutate(orderId)} />
            </CardContent>
          </Card>
        )}

        {/* Recent Completed Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Completed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {completedOrders.slice(0, 5).length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No completed orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedOrders.slice(0, 5).map((order: any) => (
                  <CompletedOrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Stats */}
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
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-bold">{user.totalOrders}</span>
                </div>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </MobileLayout>
  );
}

function ActiveOrderCard({ order }: any) {
  return (
    <div 
      className="border rounded-lg p-3 bg-blue-50 border-blue-200"
      data-testid={`active-order-${order.id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Order #{order.id.slice(0, 8)}</h3>
        <Badge className="bg-blue-100 text-blue-800">
          {order.status === 'kayayo_accepted' ? 'Shopping' : order.status}
        </Badge>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Deliver to: {order.deliveryAddress}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Your fee:</span>
          <span className="font-semibold text-primary">₵{parseFloat(order.kayayoFee || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function AvailableOrdersList({ onAccept }: any) {
  const { data: pendingOrders = [] } = useQuery({
    queryKey: ["/api/orders/pending"],
  });

  if (pendingOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No orders available right now</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingOrders.slice(0, 3).map((order: any) => (
        <div 
          key={order.id}
          className="border rounded-lg p-3"
          data-testid={`available-order-${order.id}`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Order #{order.id.slice(0, 8)}</h3>
            <span className="text-sm font-semibold text-primary">
              ₵{parseFloat(order.kayayoFee || 0).toFixed(2)} fee
            </span>
          </div>
          <div className="space-y-1 text-sm mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Deliver to: {order.deliveryAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Total: ₵{parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => onAccept(order.id)}
            data-testid={`button-accept-${order.id}`}
          >
            Accept Order
          </Button>
        </div>
      ))}
    </div>
  );
}

function CompletedOrderCard({ order }: any) {
  return (
    <div 
      className="border rounded-lg p-3"
      data-testid={`completed-order-${order.id}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Order #{order.id.slice(0, 8)}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(order.deliveredAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <span className="font-semibold text-primary">₵{parseFloat(order.kayayoFee || 0).toFixed(2)}</span>
          <Badge className="block mt-1 bg-green-100 text-green-800">Completed</Badge>
        </div>
      </div>
    </div>
  );
}
