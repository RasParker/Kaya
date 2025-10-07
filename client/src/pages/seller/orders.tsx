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
import { ArrowLeft, Clock, CheckCircle, Package, AlertCircle, Eye, XCircle, Users, QrCode } from "lucide-react";
import type { Order } from "@shared/schema";

export default function SellerOrders() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const { data: pendingOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders/pending"],
    enabled: !!user,
  });

  const confirmOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}/seller-confirm`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/pending"] });
      toast({
        title: "Order accepted",
        description: "Order has been accepted and is ready for Kayayo assignment.",
      });
    },
  });

  const declineOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}/seller-confirm`, {
        status: "cancelled"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/pending"] });
      toast({
        title: "Order declined",
        description: "Order has been declined and customer will be notified.",
        variant: "destructive"
      });
    },
  });

  const markPreparedMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, {
        status: "ready"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order marked as ready",
        description: "Order is prepared and ready for Kayayo pickup.",
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
      case 'accepted':
        return { icon: CheckCircle, label: 'Accepted', color: 'bg-blue-100 text-blue-800' };
      case 'ready':
        return { icon: Package, label: 'Ready for Pickup', color: 'bg-purple-100 text-purple-800' };
      case 'delivered':
        return { icon: CheckCircle, label: 'Delivered', color: 'bg-green-100 text-green-800' };
      default:
        return { icon: Package, label: status, color: 'bg-gray-100 text-gray-800' };
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
              {pendingOrders.map((order: Order) => (
                <PendingOrderCard
                  key={order.id}
                  order={order}
                  onConfirm={() => confirmOrderMutation.mutate(order.id)}
                  onDecline={() => declineOrderMutation.mutate(order.id)}
                  isConfirming={confirmOrderMutation.isPending && confirmOrderMutation.variables === order.id}
                  isDeclining={declineOrderMutation.isPending && declineOrderMutation.variables === order.id}
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
                {orders.map((order: Order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onMarkPrepared={() => markPreparedMutation.mutate(order.id)}
                    onViewDetails={() => setLocation(`/seller/order/${order.id}`)}
                    isUpdating={markPreparedMutation.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </MobileLayout>
  );
}

function PendingOrderCard({ order, onConfirm, onDecline, isConfirming, isDeclining }: {
  order: Order;
  onConfirm: () => void;
  onDecline: () => void;
  isConfirming: boolean;
  isDeclining: boolean;
}) {
  // Calculate time since order was created
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const now = new Date();
  const minutesElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
  const timeRemaining = Math.max(0, 10 - minutesElapsed); // 10 minute auto-decline

  return (
    <div 
      className="bg-white rounded-lg p-4 border border-yellow-200"
      data-testid={`pending-order-${order.id}`}
    >
      {/* Timer Alert */}
      {timeRemaining <= 3 && timeRemaining > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-xs text-red-700">
              Auto-decline in {timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">Order #{order.id.slice(0, 8)}</h3>
          <p className="text-xs text-muted-foreground">
            {createdAt.toLocaleString()}
          </p>
          <p className="text-xs text-yellow-600">{minutesElapsed} min ago</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary">₵{parseFloat(order.totalAmount || "0").toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Order details</p>
        </div>
      </div>

      <div className="mb-3 space-y-2">
        <div>
          <p className="text-sm text-muted-foreground">Delivery Address:</p>
          <p className="text-sm">{order.deliveryAddress}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Payment Method:</p>
          <p className="text-sm capitalize">{order.paymentMethod || 'Not specified'}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          size="sm" 
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={onConfirm}
          disabled={isConfirming || isDeclining}
          data-testid={`button-accept-${order.id}`}
        >
          {isConfirming ? 'Accepting...' : 'Accept Order'}
        </Button>
        <Button 
          size="sm" 
          variant="destructive" 
          className="flex-1"
          onClick={onDecline}
          disabled={isConfirming || isDeclining}
          data-testid={`button-decline-${order.id}`}
        >
          {isDeclining ? 'Declining...' : 'Decline'}
        </Button>
      </div>
    </div>
  );
}

function OrderCard({ order, onMarkPrepared, onViewDetails, isUpdating }: {
  order: Order;
  onMarkPrepared: () => void;
  onViewDetails: () => void;
  isUpdating: boolean;
}) {
  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  const canMarkPrepared = order.status === 'accepted';
  const canHandover = order.status === 'ready';

  return (
    <div 
      className="border rounded-lg p-4"
      data-testid={`order-card-${order.id}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">Order #{order.id.slice(0, 8)}</h3>
          <p className="text-xs text-muted-foreground">
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date not available'}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary">₵{parseFloat(order.totalAmount || "0").toFixed(2)}</p>
          <Badge className={`text-xs ${statusInfo.color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment:</span>
          <span className="capitalize">{order.paymentMethod || 'Not specified'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Delivery Address:</span>
          <span className="truncate ml-2">{order.deliveryAddress}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline"
          className="flex-1"
          onClick={onViewDetails}
          data-testid={`button-view-details-${order.id}`}
        >
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
        
        {canMarkPrepared && (
          <Button 
            size="sm" 
            className="flex-1"
            onClick={onMarkPrepared}
            disabled={isUpdating}
            data-testid={`button-mark-prepared-${order.id}`}
          >
            {isUpdating ? 'Preparing...' : 'Mark Prepared'}
          </Button>
        )}
        
        {canHandover && (
          <Button 
            size="sm" 
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              // TODO: Navigate to handover verification screen
              alert('Handover verification feature coming soon!');
            }}
            data-testid={`button-handover-${order.id}`}
          >
            <QrCode className="h-4 w-4 mr-1" />
            Handover
          </Button>
        )}
      </div>
    </div>
  );
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'pending':
      return { icon: Clock, label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    case 'accepted':
      return { icon: CheckCircle, label: 'Accepted', color: 'bg-blue-100 text-blue-800' };
    case 'ready':
      return { icon: Package, label: 'Ready for Pickup', color: 'bg-purple-100 text-purple-800' };
    case 'shopping':
      return { icon: Users, label: 'Kayayo Shopping', color: 'bg-orange-100 text-orange-800' };
    case 'delivered':
      return { icon: CheckCircle, label: 'Delivered', color: 'bg-green-100 text-green-800' };
    case 'cancelled':
      return { icon: XCircle, label: 'Cancelled', color: 'bg-red-100 text-red-800' };
    default:
      return { icon: Package, label: status, color: 'bg-gray-100 text-gray-800' };
  }
}
