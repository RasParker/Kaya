import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingBag, 
  MapPin, 
  Clock, 
  Package,
  User,
  CheckCircle
} from "lucide-react";
import type { Order } from "@shared/schema";

export default function KayayoTasks() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

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

  const isAvailable = availability?.isAvailable || false;

  // Available orders - pending and seller confirmed orders without a kayayo
  const availableOrders = orders.filter((order: Order) => 
    !order.kayayoId && ['pending', 'seller_confirmed'].includes(order.status)
  ).reverse();

  // My active orders
  const myActiveOrders = orders.filter((order: Order) => 
    order.kayayoId === user.id && ['kayayo_accepted', 'shopping'].includes(order.status)
  ).reverse();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'seller_confirmed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MobileLayout>
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary" data-testid="tasks-page-title">
              Available Tasks
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAvailable ? 'Accept orders to start earning' : 'You are currently unavailable'}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isAvailable ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-xs font-medium ${isAvailable ? 'text-green-700' : 'text-red-700'}`}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>
      </header>

      <main className="p-4 pb-20 space-y-4">
        {/* My Active Orders */}
        {myActiveOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                My Active Orders ({myActiveOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myActiveOrders.map((order: Order) => (
                <div
                  key={order.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/kayayo/order/${order.id}`)}
                  data-testid={`card-active-order-${order.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                      <Badge className={getStatusBadgeColor(order.status)} data-testid={`badge-status-${order.id}`}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      ₵{parseFloat(order.kayayoFee || "0").toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{order.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Available Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Available Orders ({availableOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isAvailable ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">
                  You are currently unavailable
                </p>
                <p className="text-sm text-muted-foreground">
                  Go to Dashboard to turn on availability
                </p>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No orders available at the moment
                </p>
                <p className="text-sm text-muted-foreground">
                  Check back later for new shopping requests
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableOrders.map((order: Order) => (
                  <div
                    key={order.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    data-testid={`card-available-order-${order.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                        <Badge className={getStatusBadgeColor(order.status)} data-testid={`badge-status-${order.id}`}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Your Fee</p>
                        <p className="text-lg font-bold text-primary">
                          ₵{parseFloat(order.kayayoFee || "0").toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{order.deliveryAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>Order Total: ₵{parseFloat(order.totalAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(order.createdAt!).toLocaleString()}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => acceptOrderMutation.mutate(order.id)}
                      disabled={acceptOrderMutation.isPending || !isAvailable}
                      data-testid={`button-accept-${order.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Order
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </MobileLayout>
  );
}
