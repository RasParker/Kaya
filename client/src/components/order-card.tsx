import { CheckCircle, Truck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OrderCardProps {
  order: {
    id: string;
    status: string;
    totalAmount: string;
    createdAt: string | Date;
  };
  onTrack: () => void;
  onReorder: () => void;
}

export default function OrderCard({ order, onTrack, onReorder }: OrderCardProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'delivered':
        return {
          icon: CheckCircle,
          label: 'Delivered',
          className: 'bg-green-100 text-green-800',
        };
      case 'in_transit':
        return {
          icon: Truck,
          label: 'On the way',
          className: 'bg-blue-100 text-blue-800',
        };
      case 'shopping':
        return {
          icon: ShoppingBag,
          label: 'Shopping',
          className: 'bg-yellow-100 text-yellow-800',
        };
      default:
        return {
          icon: ShoppingBag,
          label: 'Processing',
          className: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  
  const formatDate = (date: string | Date) => {
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
      
      <div className="flex items-center gap-2 mb-2">
        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Order details</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="font-semibold text-primary" data-testid={`text-order-total-${order.id}`}>
          ₵{parseFloat(order.totalAmount).toFixed(2)}
        </span>
        <div className="flex gap-2">
          {order.status === 'delivered' ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={onReorder}
              data-testid={`button-reorder-${order.id}`}
            >
              Reorder
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={onTrack}
              data-testid={`button-track-${order.id}`}
            >
              Track Order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
