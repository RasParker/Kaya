import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import MobileLayout from "@/components/layout/mobile-layout";
import SellerCard from "@/components/seller-card";
import KayayoCard from "@/components/kayayo-card";
import OrderCard from "@/components/order-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, Leaf, Sprout, Fish, MoreHorizontal, Home, Users, Package, User } from "lucide-react";
import { useState } from "react";

const categories = [
  { name: "Vegetables", icon: Leaf, active: true },
  { name: "Roots", icon: Sprout, active: false },
  { name: "Fish", icon: Fish, active: false },
  { name: "Spices", icon: MoreHorizontal, active: false },
  { name: "Household", icon: Home, active: false },
];

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("Vegetables");
  const [searchQuery, setSearchQuery] = useState("");

  // Role-based redirection for authenticated users
  if (isAuthenticated && user) {
    switch (user.userType) {
      case 'seller':
        setLocation('/seller/dashboard');
        return null;
      case 'kayayo':
        setLocation('/kayayo/dashboard');
        return null;
      case 'rider':
        setLocation('/rider/dashboard');
        return null;
      case 'buyer':
        // Continue to render buyer home page
        break;
      default:
        // For any unknown user types, redirect to login
        setLocation('/login');
        return null;
    }
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const { data: sellers = [] } = useQuery({
    queryKey: ["/api/sellers"],
    enabled: true,
  });

  const { data: kayayos = [] } = useQuery({
    queryKey: ["/api/kayayos/available"],
    enabled: true,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated && user?.userType === 'buyer',
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated && user?.userType === 'buyer',
  });

  const recentOrders = Array.isArray(orders) ? orders.slice(0, 2) : [];
  const cartItemCount = Array.isArray(cartItems) ? cartItems.length : 0;

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary" data-testid="app-title">Makola Connect</h1>
            <p className="text-muted-foreground text-sm">Fresh groceries, delivered fast</p>
          </div>
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="p-2 rounded-full bg-muted"
              onClick={() => setLocation("/cart")}
              data-testid="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="cart-badge" data-testid="text-cart-count">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Location Selector */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <select className="flex-1 bg-muted rounded-lg px-3 py-2 pr-8 text-sm border-0" data-testid="select-market">
            <option>Makola Market</option>
            <option>Kaneshie Market (Coming Soon)</option>
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search for tomatoes, gari, smoked fish..."
            className="pl-10 bg-muted border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-20">
        {/* Quick Categories */}
        <section className="py-4">
          <h2 className="text-lg font-semibold mb-3">Shop by Category</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.name;
              return (
                <Button
                  key={category.name}
                  variant={isActive ? "default" : "secondary"}
                  size="sm"
                  className={`category-chip whitespace-nowrap ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'
                  }`}
                  onClick={() => setSelectedCategory(category.name)}
                  data-testid={`button-category-${category.name.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </section>

        {/* Top Sellers */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Top Sellers Today</h2>
            <Button 
              variant="link" 
              size="sm" 
              className="text-primary" 
              onClick={() => setLocation("/sellers")}
              data-testid="button-view-all-sellers"
            >
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {Array.isArray(sellers) ? sellers.slice(0, 3).map((seller: any) => (
              <SellerCard 
                key={seller.id} 
                seller={seller} 
                onClick={() => setLocation(`/seller-profile?id=${seller.id}`)}
              />
            )) : null}
          </div>
        </section>

        {/* Available Kayayei */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Available Kayayei</h2>
            <span className="text-xs text-muted-foreground" data-testid="text-kayayo-count">
              {Array.isArray(kayayos) ? kayayos.length : 0} available now
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.isArray(kayayos) ? kayayos.slice(0, 5).map((kayayo: any) => (
              <KayayoCard 
                key={kayayo.id} 
                kayayo={kayayo} 
                onClick={() => setLocation(`/kayayo-profile?id=${kayayo.kayayoId}`)}
              />
            )) : null}
          </div>
        </section>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <section className="py-4">
            <h2 className="text-lg font-semibold mb-3">Your Recent Orders</h2>

            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onTrack={() => setLocation(`/orders?track=${order.id}`)}
                  onReorder={() => {
                    // TODO: Implement reorder functionality
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </MobileLayout>
  );
}