import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Search, ShoppingCart, Receipt, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth.tsx";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Browse", path: "/browse" },
  { icon: ShoppingCart, label: "Cart", path: "/cart" },
  { icon: Receipt, label: "Orders", path: "/orders" },
  { icon: User, label: "Profile", path: "/profile" },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  const cartItemCount = cartItems.length;

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
              
              {item.label === "Cart" && cartItemCount > 0 && (
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
