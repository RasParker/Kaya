import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import MobileLayout from "@/components/layout/mobile-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  ShoppingBag, 
  DollarSign, 
  Star, 
  Plus, 
  Eye,
  Clock,
  CheckCircle,
  Wallet,
  TrendingUp
} from "lucide-react";
import type { Product, Order } from "@shared/schema";

export default function SellerDashboard() {
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const { lastMessage } = useWebSocket();
  const { toast } = useToast();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", { sellerId: user?.id }],
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const { data: pendingOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders/pending"],
    enabled: !!user,
  });

  const updateOnlineStatusMutation = useMutation({
    mutationFn: async (isOnline: boolean) => {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}/online-status`, {
        isOnline
      });
      return { isOnline, data: await response.json() };
    },
    onMutate: async (newOnlineStatus) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      
      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(["/api/users"]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["/api/users"], (old: any) => {
        if (!old) return old;
        return { ...old, isOnline: newOnlineStatus };
      });
      
      return { previousUser };
    },
    onError: (err, newOnlineStatus, context) => {
      // Rollback on error
      queryClient.setQueryData(["/api/users"], context?.previousUser);
    },
    onSuccess: ({ isOnline }) => {
      // Update the user in auth context
      if (user) {
        const updatedUser = { ...user, isOnline };
        const token = localStorage.getItem('auth_token');
        if (token) {
          login(updatedUser, token);
        }
      }
      toast({
        title: "Status updated",
        description: isOnline ? "You are now online" : "You are now offline",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we're in sync
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  if (!user || user.userType !== 'seller') {
    setLocation('/login');
    return null;
  }

  const totalProducts = products.length;
  const availableProducts = products.filter((p: any) => p.isAvailable).length;
  const totalOrders = orders.length;
  const pendingOrdersCount = pendingOrders.length;

  // Calculate today's earnings
  const todayOrders = orders.filter((order: any) => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });
  
  const todayEarnings = todayOrders.reduce((sum: number, order: any) => {
    return sum + parseFloat(order.totalAmount || 0);
  }, 0);

  // Calculate weekly earnings
  const weekOrders = orders.filter((order: any) => {
    const orderDate = new Date(order.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return orderDate >= weekAgo;
  });
  
  const weeklyEarnings = weekOrders.reduce((sum: number, order: any) => {
    return sum + parseFloat(order.totalAmount || 0);
  }, 0);

  // Calculate balance (simplified - in real app this would come from backend)
  const totalEarnings = orders.reduce((sum: number, order: any) => {
    return order.status === 'delivered' ? sum + parseFloat(order.totalAmount || 0) : sum;
  }, 0);
  
  const withdrawnAmount = 0; // This would come from withdrawal records
  const availableBalance = totalEarnings - withdrawnAmount;

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="mb-2">
          {/* Title row with online status toggle */}
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold text-primary" data-testid="seller-dashboard-title">
              Seller Dashboard
            </h1>
            <Switch
              checked={user.isOnline ?? false}
              onCheckedChange={(checked) => updateOnlineStatusMutation.mutate(checked)}
              disabled={updateOnlineStatusMutation.isPending}
              data-testid="switch-online-status"
            />
          </div>
          
          {/* Subtitle row with status */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-muted-foreground">
                {user.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-primary/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <p className="text-lg font-bold text-primary" data-testid="today-earnings">
              ₵{todayEarnings.toFixed(2)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Balance</span>
            </div>
            <p className="text-lg font-bold text-green-600" data-testid="available-balance">
              ₵{availableBalance.toFixed(2)}
            </p>
          </div>
          <div className="bg-secondary/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Rating</span>
            </div>
            <p className="text-lg font-bold text-secondary" data-testid="seller-rating">
              {parseFloat(user.rating || "0").toFixed(1)}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20 space-y-4">
        {/* Pending Orders Alert */}
        {pendingOrdersCount > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-800">
                      {pendingOrdersCount} Pending Orders
                    </p>
                    <p className="text-sm text-yellow-600">
                      Customers are waiting for confirmation
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => setLocation('/seller/orders')}
                  data-testid="button-view-pending"
                >
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallet & Earnings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet & Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold text-green-600">₵{availableBalance.toFixed(2)}</p>
                </div>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setLocation('/seller/withdraw')}
                  data-testid="button-withdraw"
                >
                  Withdraw
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-lg font-semibold">₵{weeklyEarnings.toFixed(2)}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-lg font-semibold">{totalOrders}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-16 flex-col gap-2"
                onClick={() => setLocation('/seller/products')}
                data-testid="button-manage-products"
              >
                <Package className="h-5 w-5" />
                <span className="text-xs">Manage Products</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col gap-2"
                onClick={() => setLocation('/seller/orders')}
                data-testid="button-view-orders"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="text-xs">View Orders</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col gap-2"
                onClick={() => setLocation('/seller/analytics')}
                data-testid="button-analytics"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs">Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Overview */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-lg">Products</CardTitle>
            <Button 
              size="sm" 
              onClick={() => setLocation('/seller/products')}
              data-testid="button-add-product"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold" data-testid="total-products">{totalProducts}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600" data-testid="available-products">
                  {availableProducts}
                </p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {totalProducts - availableProducts}
                </p>
                <p className="text-xs text-muted-foreground">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/seller/orders')}
              data-testid="button-view-all-orders"
            >
              <Eye className="h-4 w-4 mr-1" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No orders yet
              </p>
            ) : (
              <div className="space-y-3">
                {orders.slice().reverse().slice(0, 3).map((order: any) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`order-item-${order.id}`}
                  >
                    <div>
                      <p className="font-semibold text-sm">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        ₵{parseFloat(order.totalAmount).toFixed(2)}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </Badge>
                    </div>
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

function getStatusColor(status: string) {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'in_transit':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
