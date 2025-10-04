import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import MobileLayout from "@/components/layout/mobile-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart,
  Calendar,
  Star,
  BarChart3
} from "lucide-react";
import type { Product, Order } from "@shared/schema";

export default function SellerAnalytics() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  if (!user || user.userType !== 'seller') {
    setLocation('/login');
    return null;
  }

  // Calculate analytics data
  const totalRevenue = Array.isArray(orders) 
    ? orders.reduce((sum: number, order: any) => {
        return order.status === 'delivered' ? sum + parseFloat(order.totalAmount || 0) : sum;
      }, 0)
    : 0;

  const totalOrders = Array.isArray(orders) ? orders.length : 0;
  const completedOrders = Array.isArray(orders) 
    ? orders.filter((o: any) => o.status === 'delivered').length 
    : 0;

  // Calculate this week's data
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const weekOrders = Array.isArray(orders)
    ? orders.filter((order: any) => new Date(order.createdAt) >= weekAgo)
    : [];

  const weekRevenue = weekOrders.reduce((sum: number, order: any) => {
    return order.status === 'delivered' ? sum + parseFloat(order.totalAmount || 0) : sum;
  }, 0);

  // Calculate this month's data
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  
  const monthOrders = Array.isArray(orders)
    ? orders.filter((order: any) => new Date(order.createdAt) >= monthAgo)
    : [];

  const monthRevenue = monthOrders.reduce((sum: number, order: any) => {
    return order.status === 'delivered' ? sum + parseFloat(order.totalAmount || 0) : sum;
  }, 0);

  const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

  // Product stats
  const totalProducts = Array.isArray(products) ? products.length : 0;
  const availableProducts = Array.isArray(products) 
    ? products.filter((p: any) => p.isAvailable).length 
    : 0;

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
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Analytics & Insights</h1>
            <p className="text-sm text-muted-foreground">Track your business performance</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20 space-y-4">
        {/* Revenue Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600" data-testid="total-revenue">
                  ₵{totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Avg. Order Value</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="avg-order-value">
                  ₵{averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">This Week</p>
                <p className="text-lg font-semibold" data-testid="week-revenue">
                  ₵{weekRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {weekOrders.length} orders
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">This Month</p>
                <p className="text-lg font-semibold" data-testid="month-revenue">
                  ₵{monthRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {monthOrders.length} orders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary" data-testid="total-orders-stat">
                  {totalOrders}
                </p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600" data-testid="completed-orders-stat">
                  {completedOrders}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600" data-testid="pending-orders-stat">
                  {totalOrders - completedOrders}
                </p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-2xl font-bold" data-testid="total-products-stat">
                  {totalProducts}
                </p>
                <p className="text-xs text-muted-foreground">Total Products</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600" data-testid="available-products-stat">
                  {availableProducts}
                </p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600" data-testid="out-of-stock-stat">
                  {totalProducts - availableProducts}
                </p>
                <p className="text-xs text-muted-foreground">Out of Stock</p>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Keep your products in stock to maximize sales
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Your Rating</span>
              </div>
              <Badge variant="outline" className="font-semibold" data-testid="seller-rating-badge">
                {parseFloat(user.rating || "0").toFixed(1)} ⭐
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Total Orders Served</span>
              </div>
              <Badge variant="outline" className="font-semibold" data-testid="orders-served-badge">
                {user.totalOrders || 0}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm">Completion Rate</span>
              </div>
              <Badge variant="outline" className="font-semibold" data-testid="completion-rate-badge">
                {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Growth Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Growth Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                Keep your products in stock to avoid missing out on orders
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                Respond quickly to orders to improve customer satisfaction
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                Maintain competitive pricing to attract more buyers
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </MobileLayout>
  );
}
