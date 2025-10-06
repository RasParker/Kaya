import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Store, MapPin, Clock, Languages, Award } from "lucide-react";

interface SellerWithUser {
  id: string;
  userId: string;
  stallName: string;
  stallLocation: string;
  market: string;
  specialties: string[];
  openingHours?: { start: string; end: string };
  languages?: string[];
  verificationBadge: boolean;
  user: {
    id: string;
    name: string;
    rating: string;
    totalOrders: number;
    isOnline: boolean;
    profileImage?: string;
  };
}

export default function SellerProfile() {
  const [location, setLocation] = useLocation();
  
  // Extract seller ID from URL
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const sellerId = params.get('id');

  // Fetch seller by ID
  const { data: seller, isLoading } = useQuery<SellerWithUser>({
    queryKey: ["/api/sellers", sellerId],
    enabled: !!sellerId,
  });

  if (!sellerId) {
    return (
      <MobileLayout>
        <div className="p-4">
          <p className="text-muted-foreground">Invalid seller ID</p>
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
          <p className="text-muted-foreground">Loading seller profile...</p>
        </div>
      </MobileLayout>
    );
  }

  if (!seller) {
    return (
      <MobileLayout>
        <div className="p-4">
          <p className="text-muted-foreground">Seller not found</p>
          <Button onClick={() => setLocation("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const sellerUser = seller.user || {};

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
          <h1 className="text-xl font-semibold">Seller Profile</h1>
        </div>
      </header>

      {/* Profile Content */}
      <main className="p-4 pb-20">
        {/* Profile Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center mb-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden mb-3">
                {sellerUser.profileImage ? (
                  <img
                    src={sellerUser.profileImage}
                    alt={sellerUser.name}
                    className="w-full h-full object-cover"
                    data-testid="img-seller-profile"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-muted-foreground">
                    {sellerUser.name?.charAt(0) || 'S'}
                  </span>
                )}
              </div>
              
              <h2 className="text-xl font-semibold mb-1" data-testid="text-seller-name">
                {sellerUser.name}
              </h2>
              
              {seller.stallName && (
                <p className="text-sm text-muted-foreground mb-2" data-testid="text-stall-name">
                  {seller.stallName}
                </p>
              )}

              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant={sellerUser.isOnline ? "default" : "secondary"}
                  className={sellerUser.isOnline ? "bg-green-500" : "bg-gray-500"}
                >
                  {sellerUser.isOnline ? "Online" : "Offline"}
                </Badge>
                {seller.verificationBadge && (
                  <Badge variant="secondary" className="bg-blue-500 text-white">
                    <Award className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold" data-testid="text-seller-rating">
                  {parseFloat(sellerUser.rating || '0').toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  ({sellerUser.totalOrders || 0} orders)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specialties */}
        {seller.specialties && seller.specialties.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Specialties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {seller.specialties.map((specialty: string, index: number) => (
                  <Badge key={index} variant="secondary" data-testid={`badge-specialty-${index}`}>
                    {specialty}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Stall Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Location</span>
              </div>
              <span className="font-semibold text-sm" data-testid="text-stall-location">
                {seller.stallLocation || 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Market</span>
              </div>
              <span className="font-semibold text-sm" data-testid="text-market">
                {seller.market || 'Makola'}
              </span>
            </div>

            {seller.openingHours && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Hours</span>
                </div>
                <span className="font-semibold text-sm" data-testid="text-hours">
                  {seller.openingHours.start} - {seller.openingHours.end}
                </span>
              </div>
            )}

            {seller.languages && seller.languages.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Languages</span>
                </div>
                <span className="font-semibold text-sm" data-testid="text-languages">
                  {seller.languages.join(', ')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Items Button */}
        <Button 
          className="w-full" 
          onClick={() => setLocation(`/browse?sellerId=${sellerId}`)}
          data-testid="button-view-items"
        >
          View {sellerUser.name}'s Items
        </Button>
      </main>
    </MobileLayout>
  );
}
