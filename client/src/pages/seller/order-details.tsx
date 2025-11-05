
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Package, User, Phone, Clock, CheckCircle, ChevronDown, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order, OrderItem, Product } from "@shared/schema";

interface OrderWithDetails extends Order {
  buyer?: any;
  kayayo?: any;
  rider?: any;
}

export default function SellerOrderDetails() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/seller/order/:orderId");
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [serviceProvidersOpen, setServiceProvidersOpen] = useState(false);
  const [confirmingItemId, setConfirmingItemId] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery<OrderWithDetails>({
    queryKey: [`/api/orders/${params?.orderId}`],
    enabled: !!params?.orderId,
  });

  const { data: orderItems = [], isLoading: itemsLoading } = useQuery<(OrderItem & { product: Product })[]>({
    queryKey: [`/api/orders/${params?.orderId}/items`],
    enabled: !!params?.orderId,
  });

  const confirmItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      setConfirmingItemId(itemId);
      const response = await apiRequest("PATCH", `/api/orders/${order?.id}/items/${itemId}/confirm`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${params?.orderId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${params?.orderId}`] });
      setConfirmingItemId(null);
      toast({
        title: "Item marked as ready",
        description: "Item has been marked as ready for handover.",
      });
    },
    onError: (error: any) => {
      setConfirmingItemId(null);
      toast({
        title: "Failed to mark item as ready",
        description: error.message || "Could not mark item as ready",
        variant: "destructive",
      });
    },
  });

  const verifyKayayoMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", `/api/orders/${order?.id}/verify-kayayo`, {
        verificationCode: code
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${params?.orderId}`] });
      setShowHandoverDialog(false);
      setVerificationCode("");
      toast({
        title: "Verification successful",
        description: "Kayayo verified. You can now hand over the items.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    },
  });

  if (!user || user.userType !== 'seller') {
    setLocation('/login');
    return null;
  }

  if (isLoading || itemsLoading) {
    return (
      <MobileLayout>
        <div className="p-4 text-center">
          <p>Loading order details...</p>
        </div>
      </MobileLayout>
    );
  }

  if (!order) {
    return (
      <MobileLayout>
        <div className="p-4 text-center">
          <p>Order not found</p>
          <Button onClick={() => setLocation('/seller/orders')} className="mt-4">
            Back to Orders
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'seller_confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'kayayo_accepted':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'shopping':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'ready_for_pickup':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'in_transit':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const canHandover = order.status === 'seller_confirmed' || order.status === 'kayayo_accepted' || order.status === 'shopping';
  const allItemsConfirmed = orderItems.every(item => item.isConfirmed);

  return (
    <MobileLayout>
      <header className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/seller/orders")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Order Details</h1>
            <p className="text-sm text-muted-foreground">#{order.id.slice(0, 8)}</p>
          </div>
        </div>
      </header>

      <main className="p-4 pb-20 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Order Status</span>
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace(/_/g, ' ')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Placed:</span>
              <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold text-primary">₵{parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{order.buyer?.name || 'N/A'}</p>
            </div>
            {order.buyer?.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {order.buyer.phone}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="border-b pb-3 last:border-0" data-testid={`order-item-${item.id}`}>
                  <div className="flex gap-3">
                    {item.product?.image && (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                        data-testid={`img-product-${item.id}`}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold" data-testid={`text-product-name-${item.id}`}>
                        {item.product?.name || 'Unknown Product'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × ₵{parseFloat(item.unitPrice).toFixed(2)}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1">Note: {item.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary" data-testid={`text-subtotal-${item.id}`}>
                        ₵{parseFloat(item.subtotal).toFixed(2)}
                      </p>
                      {item.isConfirmed && (
                        <Badge variant="outline" className="mt-1 text-xs" data-testid={`badge-confirmed-${item.id}`}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {!item.isConfirmed && canHandover && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => confirmItemMutation.mutate(item.id)}
                      disabled={confirmingItemId === item.id}
                      data-testid={`button-confirm-item-${item.id}`}
                    >
                      {confirmingItemId === item.id ? 'Marking as Ready...' : 'Mark as Ready'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {canHandover && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Prepare & Handover
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!allItemsConfirmed && (
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Please mark all items as ready before handing over to Kayayo
                  </p>
                </div>
              )}
              
              {order.kayayo ? (
                <div className="space-y-3">
                  <div className="bg-white dark:bg-gray-900 border rounded-lg p-3">
                    <p className="text-sm text-muted-foreground mb-1">Kayayo Assigned</p>
                    <p className="font-medium">{order.kayayo.name}</p>
                    {order.kayayo.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {order.kayayo.phone}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={() => setShowHandoverDialog(true)}
                    disabled={!allItemsConfirmed}
                    data-testid="button-handover"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Hand Over to Kayayo
                  </Button>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    Waiting for Kayayo assignment...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(order.kayayo || order.rider) && (
          <Collapsible open={serviceProvidersOpen} onOpenChange={setServiceProvidersOpen}>
            <Card>
              <CollapsibleTrigger className="w-full" data-testid="button-toggle-service-providers">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Service Providers</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${serviceProvidersOpen ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  {order.kayayo && (
                    <div data-testid="kayayo-info">
                      <p className="text-sm text-muted-foreground">Kayayo</p>
                      <p className="font-medium">{order.kayayo.name}</p>
                      {order.kayayo.phone && (
                        <p className="text-sm text-muted-foreground">{order.kayayo.phone}</p>
                      )}
                    </div>
                  )}
                  {order.rider && (
                    <div data-testid="rider-info">
                      <p className="text-sm text-muted-foreground">Rider</p>
                      <p className="font-medium">{order.rider.name}</p>
                      {order.rider.phone && (
                        <p className="text-sm text-muted-foreground">{order.rider.phone}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </main>

      <Dialog open={showHandoverDialog} onOpenChange={setShowHandoverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Kayayo Pickup</DialogTitle>
            <DialogDescription>
              Ask the Kayayo to show their pickup code, then enter it below to confirm identity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Instructions:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Ask Kayayo to open their order details</li>
                <li>They should tap "Show Pickup Code"</li>
                <li>Enter the 6-digit code they display below</li>
              </ol>
            </div>
            
            <div>
              <Label htmlFor="verification-code">Kayayo's Pickup Code</Label>
              <Input
                id="verification-code"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
                data-testid="input-verification-code"
              />
            </div>
            
            <Button
              className="w-full"
              onClick={() => verifyKayayoMutation.mutate(verificationCode)}
              disabled={verificationCode.length !== 6 || verifyKayayoMutation.isPending}
              data-testid="button-verify-code"
            >
              {verifyKayayoMutation.isPending ? 'Verifying...' : 'Verify & Hand Over'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
