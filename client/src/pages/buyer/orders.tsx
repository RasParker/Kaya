import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import MobileLayout from "@/components/layout/mobile-layout";
import OrderCard from "@/components/order-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import type { Order } from "@shared/schema";

export default function Orders() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

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
          <h1 className="text-xl font-semibold">My Orders</h1>
        </div>
      </header>

      {/* Orders List */}
      <main className="p-4 pb-20">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-4">
              Your order history will appear here
            </p>
            <Button onClick={() => setLocation("/browse")} data-testid="button-start-shopping">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onTrack={() => {
                  // TODO: Navigate to order tracking page
                }}
                onReorder={() => {
                  // TODO: Implement reorder functionality
                }}
              />
            ))}
          </div>
        )}
      </main>
    </MobileLayout>
  );
}
