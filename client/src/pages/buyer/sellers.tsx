import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MobileLayout from "@/components/layout/mobile-layout";
import SellerCard from "@/components/seller-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";
import { useState } from "react";

export default function SellersPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sellers = [], isLoading } = useQuery({
    queryKey: ["/api/sellers"],
    enabled: true,
  });

  // Filter sellers based on search query
  const filteredSellers = Array.isArray(sellers) 
    ? sellers.filter((seller: any) => {
        const searchLower = searchQuery.toLowerCase();
        const name = seller.user?.name?.toLowerCase() || '';
        const stallName = seller.stallName?.toLowerCase() || '';
        const specialties = (seller.specialties || []).join(' ').toLowerCase();
        
        return name.includes(searchLower) || 
               stallName.includes(searchLower) || 
               specialties.includes(searchLower);
      })
    : [];

  return (
    <MobileLayout>
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">All Sellers</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search sellers..."
            className="pl-10 bg-muted border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-sellers"
          />
        </div>
      </header>

      {/* Sellers List */}
      <main className="p-4 pb-20">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading sellers...</p>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No sellers found matching your search" : "No sellers available"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSellers.map((seller: any) => (
              <SellerCard 
                key={seller.id} 
                seller={seller} 
                onClick={() => setLocation(`/seller-profile?id=${seller.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </MobileLayout>
  );
}
