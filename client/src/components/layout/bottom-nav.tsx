import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Search, ShoppingCart, Receipt, User, Package, Truck, MapPin, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth.tsx";

const getNavItemsForUserType = (userType: string | undefined) => {
  switch (userType) {
    case 'buyer':
      return [
        { icon: Home, label: "Home", path: "/" },
        { icon: Search, label: "Browse", path: "/browse" },
        { icon: ShoppingCart, label: "Cart", path: "/cart" },
        { icon: Receipt, label: "Orders", path: "/orders" },
        { icon: User, label: "Profile", path: "/profile" },
      ];
    case 'seller':
      return [
        { icon: BarChart3, label: "Dashboard", path: "/seller/dashboard" },
        { icon: Package, label: "Products", path: "/seller/products" },
        { icon: Receipt, label: "Orders", path: "/seller/orders" },
        { icon: User, label: "Profile", path: "/profile" },
      ];
    case 'kayayo':
      return [
        { icon: BarChart3, label: "Dashboard", path: "/kayayo/dashboard" },
        { icon: MapPin, label: "Tasks", path: "/kayayo/tasks" },
        { icon: User, label: "Profile", path: "/profile" },
      ];
    case 'rider':
      return [
        { icon: BarChart3, label: "Dashboard", path: "/rider/dashboard" },
        { icon: Truck, label: "Deliveries", path: "/rider/deliveries" },
        { icon: User, label: "Profile", path: "/profile" },
      ];
    default:
      // Default for unauthenticated users
      return [
        { icon: Home, label: "Home", path: "/" },
        { icon: Search, label: "Browse", path: "/browse" },
        { icon: User, label: "Login", path: "/login" },
      ];
  }
};

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated && user?.userType === 'buyer',
  });

  const cartItemCount = Array.isArray(cartItems) ? cartItems.length : 0;
  const navItems = getNavItemsForUserType(user?.userType);

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 py-2 px-4 relative ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => setLocation(item.path)}
              data-testid={`button-nav-${item.label.toLowerCase()}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
              
              {item.label === "Cart" && user?.userType === 'buyer' && cartItemCount > 0 && (
                <Badge className="cart-badge" data-testid="text-nav-cart-count">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
