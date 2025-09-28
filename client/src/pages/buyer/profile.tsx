import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Phone, MapPin, Star, Package, LogOut, Settings } from "lucide-react";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <MobileLayout>
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Profile</h1>
        </div>
      </header>

      {/* Profile Content */}
      <main className="p-4 pb-20">
        {/* User Info Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                    data-testid="img-profile"
                  />
                ) : (
                  <User className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold" data-testid="text-user-name">
                  {user.name}
                </h2>
                <p className="text-muted-foreground" data-testid="text-user-type">
                  {user.userType === 'buyer' ? 'Customer' : user.userType}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm" data-testid="text-user-phone">{user.phone}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">
                  Rating: <span data-testid="text-user-rating">{parseFloat(user.rating).toFixed(1)}</span> stars
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Total Orders: <span data-testid="text-user-orders">{user.totalOrders}</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/orders")}
              data-testid="button-view-orders"
            >
              <Package className="h-4 w-4 mr-3" />
              View Order History
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/browse")}
              data-testid="button-start-shopping"
            >
              <MapPin className="h-4 w-4 mr-3" />
              Start Shopping
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              data-testid="button-settings"
            >
              <Settings className="h-4 w-4 mr-3" />
              Account Settings
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </MobileLayout>
  );
}
