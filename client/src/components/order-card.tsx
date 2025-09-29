import { CheckCircle, Truck, ShoppingBag, Clock, Package, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import type { Order } from "@shared/schema";

interface OrderCardProps {
  order: Order;
  onTrack: () => void;
  onReorder: () => void;
}

export default function OrderCard({ order, onTrack, onReorder }: OrderCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Confirm delivery mutation
  const confirmDeliveryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/orders/${order.id}`, { status: "delivered" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Delivery confirmed!",
        description: "Thank you for confirming your order delivery.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to confirm delivery",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/orders/${order.id}`, { status: "cancelled" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to cancel order",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'delivered':
        return {
          icon: CheckCircle,
          label: 'Delivered',
          description: 'Order successfully delivered',
          className: 'bg-green-100 text-green-800',
          progress: 100
        };
      case 'picked_up':
      case 'in_transit':
        return {
          icon: Truck,
          label: 'Out for Delivery', 
          description: 'Rider is on the way to you',
          className: 'bg-blue-100 text-blue-800',
          progress: 85
        };
      case 'ready':
        return {
          icon: Package,
          label: 'Ready for Pickup',
          description: 'Waiting for rider pickup',
          className: 'bg-purple-100 text-purple-800',
          progress: 70
        };
      case 'shopping':
        return {
          icon: ShoppingBag,
          label: 'Shopping',
          description: 'Kayayo is shopping for your items',
          className: 'bg-yellow-100 text-yellow-800',
          progress: 50
        };
      case 'accepted':
        return {
          icon: User,
          label: 'Accepted',
          description: 'Sellers confirmed your order',
          className: 'bg-blue-100 text-blue-800',
          progress: 30
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          description: 'Waiting for seller confirmation',
          className: 'bg-gray-100 text-gray-800',
          progress: 10
        };
      case 'cancelled':
        return {
          icon: AlertCircle,
          label: 'Cancelled',
          description: 'Order was cancelled',
          className: 'bg-red-100 text-red-800',
          progress: 0
        };
      default:
        return {
          icon: Clock,
          label: 'Processing',
          description: 'Order is being processed',
          className: 'bg-gray-100 text-gray-800',
          progress: 15
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    const d = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return d.toLocaleDateString();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4" data-testid={`card-order-${order.id}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" data-testid={`text-order-id-${order.id}`}>
            #{order.id.slice(0, 8)}
          </span>
          <Badge className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground" data-testid={`text-order-date-${order.id}`}>
          {formatDate(order.createdAt)}
        </span>
      </div>
      
      {/* Status Description and Progress */}
      <div className="mb-3">
        <p className="text-sm text-muted-foreground mb-2">{statusInfo.description}</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${statusInfo.progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">₵{parseFloat(order.totalAmount || '0').toFixed(2)} • {order.deliveryAddress ? order.deliveryAddress.slice(0, 30) + '...' : 'No address'}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="font-semibold text-primary" data-testid={`text-order-total-${order.id}`}>
          ₵{parseFloat(order.totalAmount).toFixed(2)}
        </span>
        <div className="flex gap-2">
          {order.status === 'delivered' ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={onReorder}
                data-testid={`button-reorder-${order.id}`}
              >
                Reorder
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="text-xs"
                onClick={() => {
                  toast({
                    title: "Ratings feature coming soon!",
                    description: "Order rating functionality will be available soon.",
                  });
                }}
                data-testid={`button-rate-${order.id}`}
              >
                Rate Order
              </Button>
            </>
          ) : (order.status === 'picked_up' || order.status === 'in_transit') ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={onTrack}
                data-testid={`button-track-${order.id}`}
              >
                Track Delivery
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="text-xs bg-green-600 hover:bg-green-700"
                onClick={() => confirmDeliveryMutation.mutate()}
                disabled={confirmDeliveryMutation.isPending}
                data-testid={`button-confirm-delivery-${order.id}`}
              >
                Confirm Receipt
              </Button>
            </>
          ) : order.status === 'cancelled' ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={onReorder}
              data-testid={`button-reorder-cancelled-${order.id}`}
            >
              Order Again
            </Button>
          ) : order.status === 'pending' ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={onTrack}
                data-testid={`button-view-details-${order.id}`}
              >
                View Details
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="text-xs"
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel this order?')) {
                    cancelOrderMutation.mutate();
                  }
                }}
                disabled={cancelOrderMutation.isPending}
                data-testid={`button-cancel-${order.id}`}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={onTrack}
                data-testid={`button-track-${order.id}`}
              >
                Track Order
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => {
                  toast({
                    title: "Support contact",
                    description: "Support chat functionality will be available soon.",
                  });
                }}
                data-testid={`button-contact-support-${order.id}`}
              >
                Need Help?
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
