import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Package, MapPin, Clock, CheckCircle } from "lucide-react";

export default function KayayoProfile() {
  const [location, setLocation] = useLocation();
  
  // Extract kayayo ID from URL
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const kayayoId = params.get('id');

  // Fetch all available kayayos and find the specific one
  const { data: kayayos = [], isLoading } = useQuery({
    queryKey: ["/api/kayayos/available"],
    enabled: !!kayayoId,
  });

  const kayayo = Array.isArray(kayayos) 
    ? kayayos.find((k: any) => k.id === kayayoId || k.kayayoId === kayayoId || k.user?.id === kayayoId) 
    : undefined;

  if (!kayayoId) {
    return (
      <MobileLayout>
        <div className="p-4">
          <p className="text-muted-foreground">Invalid kayayo ID</p>
          <Button onClick={() => setLocation("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </MobileLayout>
    );
  }

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="p-4">
          <p className="text-muted-foreground">Loading kayayo profile...</p>
        </div>
      </MobileLayout>
    );
  }

  if (!kayayo) {
    return (
      <MobileLayout>
        <div className="p-4">
          <p className="text-muted-foreground">Kayayo not found</p>
          <Button onClick={() => setLocation("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const kayayoUser = kayayo.user || {};

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
          <h1 className="text-xl font-semibold">Kayayo Profile</h1>
        </div>
      </header>

      {/* Profile Content */}
      <main className="p-4 pb-20">
        {/* Profile Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center mb-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden mb-3">
                {kayayoUser.profileImage ? (
                  <img
                    src={kayayoUser.profileImage}
                    alt={kayayoUser.name}
                    className="w-full h-full object-cover"
                    data-testid="img-kayayo-profile"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-muted-foreground">
                    {kayayoUser.name?.charAt(0) || 'K'}
                  </span>
                )}
              </div>
              
              <h2 className="text-xl font-semibold mb-1" data-testid="text-kayayo-name">
                {kayayoUser.name}
              </h2>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant={kayayo.isAvailable ? "default" : "secondary"}
                  className={kayayo.isAvailable ? "bg-green-500" : "bg-yellow-500"}
                >
                  {kayayo.isAvailable ? "Available" : "Busy"}
                </Badge>
              </div>

              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold" data-testid="text-kayayo-rating">
                  {parseFloat(kayayoUser.rating || '0').toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  ({kayayoUser.totalOrders || 0} orders)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Stats & Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Total Orders</span>
              </div>
              <span className="font-semibold" data-testid="text-total-orders">
                {kayayoUser.totalOrders || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Current Location</span>
              </div>
              <span className="font-semibold" data-testid="text-location">
                {kayayo.currentLocation || 'Market'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Active Orders</span>
              </div>
              <span className="font-semibold" data-testid="text-active-orders">
                {kayayo.currentOrders || 0} / {kayayo.maxOrders || 3}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Market</span>
              </div>
              <span className="font-semibold" data-testid="text-market">
                {kayayo.market || 'Makola'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Info Note */}
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground text-center">
              Kayayei help shop for your items at the market. They'll visit multiple sellers to collect your order and prepare it for delivery.
            </p>
          </CardContent>
        </Card>
      </main>
    </MobileLayout>
  );
}
