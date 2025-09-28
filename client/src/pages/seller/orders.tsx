import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { apiRequest } from "@/lib/queryClient";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, CheckCircle, Package, AlertCircle } from "lucide-react";

export default function SellerOrders() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const { data: pendingOrders = [] } = useQuery({
    queryKey: ["/api/orders/pending"],
    enabled: !!user,
  });

  const confirmOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, {
        status: "seller_confirmed"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/pending"] });
      toast({
        title: "Order confirmed",
        description: "Order has been confirmed and is ready for Kayayo pickup.",
      });
    },
  });

  if (!user || user.userType !== 'seller') {
    setLocation('/login');
    return null;
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Pending Confirmation', color: 'bg-yellow-100 text-yellow-800' };
      case 'seller_confirmed':
        return { icon: CheckCircle, label: 'Confirmed', color: 'bg-blue-100 text-blue-800' };
      case 'delivered':
        return { icon: CheckCircle, label: 'Delivered', color: 'bg-green-100 text-green-800' };
      default:
        return { icon: Package, label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <MobileLayout>
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/seller/dashboard")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Orders</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20">
        {/* Pending Orders Section */}
        {pendingOrders.length > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-lg text-yellow-800">
                  Pending Confirmations ({pendingOrders.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingOrders.map((order: any) => (
                <PendingOrderCard
                  key={order.id}
                  order={order}
                  onConfirm={() => confirmOrderMutation.mutate(order.id)}
                  isConfirming={confirmOrderMutation.isPending}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* All Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">No orders yet</h2>
                <p className="text-muted-foreground">
                  Your order history will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </MobileLayout>
  );
}

function PendingOrderCard({ order, onConfirm, isConfirming }: any) {
  return (
    <div 
      className="bg-white rounded-lg p-4 border border-yellow-200"
      data-testid={`pending-order-${order.id}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">Order #{order.id.slice(0, 8)}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary">₵{parseFloat(order.totalAmount).toFixed(2)}</p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-muted-foreground">Delivery Address:</p>
        <p className="text-sm">{order.deliveryAddress}</p>
      </div>

      <div className="flex gap-2">
        <Button 
          size="sm" 
          className="flex-1"
          onClick={onConfirm}
          disabled={isConfirming}
          data-testid={`button-confirm-${order.id}`}
        >
          {isConfirming ? 'Confirming...' : 'Confirm Order'}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1"
          data-testid={`button-decline-${order.id}`}
        >
          Decline
        </Button>
      </div>
    </div>
  );
}

function OrderCard({ order }: any) {
  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div 
      className="border rounded-lg p-4"
      data-testid={`order-card-${order.id}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">Order #{order.id.slice(0, 8)}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary">₵{parseFloat(order.totalAmount).toFixed(2)}</p>
          <Badge className={`text-xs ${statusInfo.color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Delivery Fee:</span>
          <span>₵{parseFloat(order.deliveryFee || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Kayayo Fee:</span>
          <span>₵{parseFloat(order.kayayoFee || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Platform Fee:</span>
          <span>₵{parseFloat(order.platformFee || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'pending':
      return { icon: Clock, label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    case 'seller_confirmed':
      return { icon: CheckCircle, label: 'Confirmed', color: 'bg-blue-100 text-blue-800' };
    case 'delivered':
      return { icon: CheckCircle, label: 'Delivered', color: 'bg-green-100 text-green-800' };
    default:
      return { icon: Package, label: status, color: 'bg-gray-100 text-gray-800' };
  }
}
