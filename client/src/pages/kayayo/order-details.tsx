import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  MapPin, 
  Package, 
  User, 
  Phone, 
  CheckCircle,
  Camera,
  QrCode,
  Route,
  Clock,
  Star
} from "lucide-react";
import type { Order } from "@shared/schema";

export default function KayayoOrderDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/kayayo/order/:orderId");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: [`/api/orders/${params?.orderId}`],
    enabled: !!params?.orderId,
  });

  const startShoppingMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("No order found");
      const response = await apiRequest("PATCH", `/api/orders/${order.id}`, {
        status: "shopping"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Shopping started",
        description: "Order status updated to shopping. Begin collecting items.",
      });
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("No order found");
      const response = await apiRequest("PATCH", `/api/orders/${order.id}`, {
        status: "ready"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order ready for pickup",
        description: "All items collected. Ready for rider handover.",
      });
    },
  });

  if (!user || user.userType !== 'kayayo') {
    setLocation('/login');
    return null;
  }

  if (isLoading) {
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
          <Button onClick={() => setLocation('/kayayo/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </MobileLayout>
    );
  }

  // Mock shopping items (in real app, this would come from order.items)
  const mockItems = [
    { id: "1", name: "Fresh Tomatoes", quantity: "3 pieces", price: "₵5.00", completed: false, seller: "Mama Ama's Stall" },
    { id: "2", name: "Onions", quantity: "2 kg", price: "₵8.00", completed: false, seller: "Kwame's Vegetables" },
    { id: "3", name: "Rice", quantity: "1 bag", price: "₵25.00", completed: false, seller: "Auntie Grace" },
    { id: "4", name: "Palm Oil", quantity: "1 liter", price: "₵12.00", completed: false, seller: "Uncle Kofi" }
  ];

  const canStartShopping = order.status === 'kayayo_accepted';
  const isShopping = order.status === 'shopping';
  const isReady = order.status === 'ready';

  return (
    <MobileLayout>
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/kayayo/dashboard")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Order Details</h1>
            <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge className={`${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </Badge>
          <p className="text-sm font-semibold text-primary">
            Fee: ₵{parseFloat(order.kayayoFee || "0").toFixed(2)}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20 space-y-4">
        {/* Buyer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Buyer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span>Customer #{order.buyerId.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{order.deliveryAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Payment:</span>
                <span className="capitalize">{order.paymentMethod || 'Cash'}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => alert('Call buyer feature coming soon!')}
                data-testid="button-call-buyer"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Buyer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shopping Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shopping Checklist ({mockItems.filter(item => item.completed).length}/{mockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockItems.map((item) => (
                <ShoppingItemCard 
                  key={item.id} 
                  item={item} 
                  canCheck={isShopping}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Route */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Route className="h-5 w-5" />
              Market Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Mama Ama\'s Stall', 'Kwame\'s Vegetables', 'Auntie Grace', 'Uncle Kofi'].map((seller, index) => (
                <div key={seller} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{seller}</p>
                    <p className="text-xs text-muted-foreground">Section {String.fromCharCode(65 + index)}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => alert('Navigation feature coming soon!')}
                    data-testid={`button-navigate-${index}`}
                  >
                    Navigate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {canStartShopping && (
            <Button 
              className="w-full h-12 bg-green-600 hover:bg-green-700"
              onClick={() => startShoppingMutation.mutate()}
              disabled={startShoppingMutation.isPending}
              data-testid="button-start-shopping"
            >
              {startShoppingMutation.isPending ? 'Starting...' : 'Start Shopping'}
            </Button>
          )}

          {isShopping && (
            <>
              <Button 
                className="w-full h-12"
                onClick={() => markReadyMutation.mutate()}
                disabled={markReadyMutation.isPending}
                data-testid="button-mark-ready"
              >
                {markReadyMutation.isPending ? 'Updating...' : 'Mark Ready for Pickup'}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  onClick={() => alert('Seller verification feature coming soon!')}
                  data-testid="button-verify-seller"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Verify Seller
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => alert('Photo proof feature coming soon!')}
                  data-testid="button-photo-proof"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Photo Proof
                </Button>
              </div>
            </>
          )}

          {isReady && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Order Ready!</h3>
              <p className="text-muted-foreground">Waiting for rider pickup</p>
            </div>
          )}
        </div>
      </main>
    </MobileLayout>
  );
}

function ShoppingItemCard({ item, canCheck }: { 
  item: { id: string; name: string; quantity: string; price: string; completed: boolean; seller: string }; 
  canCheck: boolean;
}) {
  return (
    <div className={`border rounded-lg p-3 ${item.completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={item.completed}
          disabled={!canCheck}
          className="mt-1"
          data-testid={`checkbox-item-${item.id}`}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-medium text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
              {item.name}
            </h4>
            <span className="text-sm font-semibold text-primary">{item.price}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">{item.quantity}</p>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{item.seller}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'kayayo_accepted':
      return 'bg-blue-100 text-blue-800';
    case 'shopping':
      return 'bg-orange-100 text-orange-800';
    case 'ready':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'kayayo_accepted':
      return 'Accepted';
    case 'shopping':
      return 'Shopping';
    case 'ready':
      return 'Ready for Pickup';
    default:
      return status;
  }
}