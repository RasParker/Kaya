import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  MapPin, 
  Package, 
  User, 
  Phone, 
  CheckCircle,
  Camera,
  QrCode,
  Route,
  Clock,
  Star,
  MessageCircle,
  PhoneCall,
  Bike,
  AlertCircle
} from "lucide-react";
import type { Order, OrderItem, Product } from "@shared/schema";
import { useState } from "react";

export default function KayayoOrderDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/kayayo/order/:orderId");
  const { user } = useAuth();
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showRiderHandoverDialog, setShowRiderHandoverDialog] = useState(false);
  const [showCommunicationDialog, setShowCommunicationDialog] = useState(false);
  const [communicationType, setCommunicationType] = useState<"buyer" | "seller" | "rider" | "support">("buyer");

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: [`/api/orders/${params?.orderId}`],
    enabled: !!params?.orderId,
  });

  const { data: orderItems = [], isLoading: itemsLoading } = useQuery<(OrderItem & { product: Product })[]>({
    queryKey: [`/api/orders/${params?.orderId}/items`],
    enabled: !!params?.orderId,
  });

  const startShoppingMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("No order found");
      const response = await apiRequest("PATCH", `/api/orders/${order.id}/start-shopping`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${params?.orderId}`] });
      toast({
        title: "Shopping started",
        description: "Order status updated to shopping. Begin collecting items.",
      });
    },
  });

  const toggleItemPickedMutation = useMutation({
    mutationFn: async ({ itemId, isPicked }: { itemId: string; isPicked: boolean }) => {
      const response = await apiRequest("PATCH", `/api/order-items/${itemId}/pick`, {
        isPicked
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${params?.orderId}/items`] });
      toast({
        title: "Item updated",
        description: "Shopping progress updated",
      });
    },
  });

  const verifySellerMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", `/api/orders/${order?.id}/verify-seller`, {
        verificationCode: code
      });
      return response.json();
    },
    onSuccess: () => {
      setShowVerificationDialog(false);
      setVerificationCode("");
      toast({
        title: "Seller verified",
        description: "Handover from seller confirmed",
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

  const markReadyMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("No order found");
      const response = await apiRequest("PATCH", `/api/orders/${order.id}/mark-ready`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${params?.orderId}`] });
      toast({
        title: "Order ready for pickup",
        description: "All items collected. Ready for rider handover.",
      });
    },
  });

  const handoverToRiderMutation = useMutation({
    mutationFn: async ({ riderId, verificationCode }: { riderId: string; verificationCode: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${order?.id}/handover-to-rider`, {
        riderId,
        verificationCode
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${params?.orderId}`] });
      setShowRiderHandoverDialog(false);
      toast({
        title: "Handover successful",
        description: "Order handed over to rider successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Handover failed",
        description: error.message || "Verification failed",
        variant: "destructive",
      });
    },
  });

  if (!user || user.userType !== 'kayayo') {
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
          <Button onClick={() => setLocation('/kayayo/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const canStartShopping = order.status === 'kayayo_accepted';
  const isShopping = order.status === 'shopping';
  const isReady = order.status === 'ready_for_pickup' || order.status === 'ready';
  const inTransit = order.status === 'in_transit';

  // Calculate shopping progress
  const totalItems = orderItems.length;
  const pickedItems = orderItems.filter(item => item.isPicked).length;
  const progressPercentage = totalItems > 0 ? (pickedItems / totalItems) * 100 : 0;

  // Group items by seller
  const itemsBySeller = orderItems.reduce((acc, item) => {
    const sellerKey = item.sellerId;
    if (!acc[sellerKey]) {
      acc[sellerKey] = [];
    }
    acc[sellerKey].push(item);
    return acc;
  }, {} as Record<string, typeof orderItems>);

  const sellers = Object.keys(itemsBySeller);

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/kayayo/dashboard")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Order Details</h1>
            <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge className={`${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </Badge>
          <p className="text-sm font-semibold text-primary">
            Fee: ₵{parseFloat(order.kayayoFee || "0").toFixed(2)}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20 space-y-4">
        {/* Shopping Progress Bar */}
        {isShopping && (
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Shopping Progress</span>
                  <span className="text-sm font-bold text-primary">
                    {pickedItems}/{totalItems} items
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-xs text-muted-foreground text-center">
                  {progressPercentage === 100 ? "All items collected!" : "Keep going!"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Communication Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Communication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setCommunicationType("buyer");
                  setShowCommunicationDialog(true);
                }}
                data-testid="button-contact-buyer"
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                Call Buyer
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setCommunicationType("seller");
                  setShowCommunicationDialog(true);
                }}
                data-testid="button-contact-seller"
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                Call Seller
              </Button>
              {order.riderId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setCommunicationType("rider");
                    setShowCommunicationDialog(true);
                  }}
                  data-testid="button-contact-rider"
                >
                  <Bike className="h-4 w-4 mr-2" />
                  Call Rider
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setCommunicationType("support");
                  setShowCommunicationDialog(true);
                }}
                data-testid="button-contact-support"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Support
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{order.deliveryAddress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment:</span>
                <Badge className="capitalize">{order.paymentMethod || 'Cash'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Your Fee:</span>
                <span className="font-bold text-primary">₵{parseFloat(order.kayayoFee || "0").toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shopping Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shopping Checklist ({pickedItems}/{totalItems})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <ShoppingItemCard 
                  key={item.id} 
                  item={item} 
                  canCheck={isShopping}
                  onToggle={(isPicked) => toggleItemPickedMutation.mutate({ itemId: item.id, isPicked })}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Route */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Route className="h-5 w-5" />
              Market Route ({sellers.length} Sellers)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sellers.map((sellerId, index) => {
                const sellerItems = itemsBySeller[sellerId];
                const sellerItemsCount = sellerItems.length;
                const sellerPickedCount = sellerItems.filter(item => item.isPicked).length;
                const allPicked = sellerPickedCount === sellerItemsCount;
                
                return (
                  <div 
                    key={sellerId} 
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      allPicked ? 'bg-green-50 border-green-200' : 'bg-muted/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${
                      allPicked ? 'bg-green-500' : 'bg-primary'
                    } text-primary-foreground text-sm flex items-center justify-center font-semibold`}>
                      {allPicked ? '✓' : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Seller #{sellerId.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {sellerPickedCount}/{sellerItemsCount} items collected
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant={allPicked ? "ghost" : "outline"}
                      onClick={() => {
                        toast({
                          title: "Navigation",
                          description: `Route to seller ${index + 1}: Section ${String.fromCharCode(65 + index)}`,
                        });
                      }}
                      data-testid={`button-navigate-${index}`}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      {allPicked ? 'Done' : 'Go'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {canStartShopping && (
            <Button 
              className="w-full h-12 bg-green-600 hover:bg-green-700"
              onClick={() => startShoppingMutation.mutate()}
              disabled={startShoppingMutation.isPending}
              data-testid="button-start-shopping"
            >
              {startShoppingMutation.isPending ? 'Starting...' : 'Start Shopping'}
            </Button>
          )}

          {isShopping && (
            <>
              <Button 
                className="w-full h-12"
                onClick={() => markReadyMutation.mutate()}
                disabled={markReadyMutation.isPending || progressPercentage < 100}
                data-testid="button-mark-ready"
              >
                {markReadyMutation.isPending ? 'Updating...' : progressPercentage < 100 ? 'Complete All Items First' : 'Mark Ready for Pickup'}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowVerificationDialog(true)}
                  data-testid="button-verify-seller"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Verify Seller
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Photo Proof",
                      description: "Camera feature - Take photos of items for verification",
                    });
                  }}
                  data-testid="button-photo-proof"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Photo Proof
                </Button>
              </div>
            </>
          )}

          {isReady && !inTransit && (
            <div className="space-y-3">
              <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold mb-1">All Items Collected!</h3>
                <p className="text-sm text-muted-foreground">Ready for rider handover</p>
              </div>
              <Button 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowRiderHandoverDialog(true)}
                data-testid="button-handover-to-rider"
              >
                <Bike className="h-5 w-5 mr-2" />
                Handover to Rider
              </Button>
            </div>
          )}

          {inTransit && (
            <div className="text-center py-8">
              <Bike className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Out for Delivery</h3>
              <p className="text-muted-foreground">Rider is on the way</p>
            </div>
          )}
        </div>
      </main>

      {/* Seller Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Seller Handover</DialogTitle>
            <DialogDescription>
              Enter the 4-digit verification code provided by the seller
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                maxLength={4}
                placeholder="0000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
                data-testid="input-verification-code"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => verifySellerMutation.mutate(verificationCode)}
              disabled={verificationCode.length !== 4 || verifySellerMutation.isPending}
              data-testid="button-verify-code"
            >
              {verifySellerMutation.isPending ? 'Verifying...' : 'Verify Handover'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rider Handover Dialog */}
      <Dialog open={showRiderHandoverDialog} onOpenChange={setShowRiderHandoverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Handover to Rider</DialogTitle>
            <DialogDescription>
              Confirm rider identity and enter verification code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Order Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Items:</span>
                  <span className="font-semibold">{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Fee:</span>
                  <span className="font-semibold text-primary">₵{parseFloat(order.kayayoFee || "0").toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-300 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2 text-center">Expected Rider Code:</p>
              <p className="text-3xl font-bold text-green-900 tracking-widest text-center" data-testid="text-expected-rider-code">
                {order.id.slice(0, 4).split('').map((char: string) => {
                  const code = char.charCodeAt(0);
                  return (code % 10).toString();
                }).join('')}
              </p>
              <p className="text-xs text-muted-foreground mt-2 text-center">Ask rider to show their pickup code</p>
            </div>
            <div>
              <Label htmlFor="rider-code">Enter Rider's Code to Confirm</Label>
              <Input
                id="rider-code"
                type="text"
                maxLength={4}
                placeholder="0000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
                data-testid="input-rider-code"
              />
              <p className="text-xs text-muted-foreground mt-1">The codes must match to complete handover</p>
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (order.riderId) {
                  handoverToRiderMutation.mutate({
                    riderId: order.riderId,
                    verificationCode
                  });
                }
              }}
              disabled={verificationCode.length !== 4 || handoverToRiderMutation.isPending || !order.riderId}
              data-testid="button-confirm-handover"
            >
              {handoverToRiderMutation.isPending ? 'Processing...' : 'Confirm Handover'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Communication Dialog */}
      <Dialog open={showCommunicationDialog} onOpenChange={setShowCommunicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {communicationType === "buyer" ? "Buyer" : communicationType === "seller" ? "Seller" : communicationType === "rider" ? "Rider" : "Support"}</DialogTitle>
            <DialogDescription>
              Choose how you'd like to communicate
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => {
                toast({
                  title: "Calling...",
                  description: `Initiating call to ${communicationType}`,
                });
                setShowCommunicationDialog(false);
              }}
              data-testid="button-call"
            >
              <PhoneCall className="h-5 w-5 mr-3" />
              Call {communicationType === "support" ? "Support Hotline" : communicationType.charAt(0).toUpperCase() + communicationType.slice(1)}
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => {
                toast({
                  title: "Messaging",
                  description: `Opening chat with ${communicationType}`,
                });
                setShowCommunicationDialog(false);
              }}
              data-testid="button-message"
            >
              <MessageCircle className="h-5 w-5 mr-3" />
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}

function ShoppingItemCard({ item, canCheck, onToggle }: { 
  item: OrderItem & { product: Product }; 
  canCheck: boolean;
  onToggle: (isPicked: boolean) => void;
}) {
  return (
    <div className={`border rounded-lg p-3 ${item.isPicked ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={item.isPicked || false}
          onCheckedChange={onToggle}
          disabled={!canCheck}
          className="mt-1"
          data-testid={`checkbox-item-${item.id}`}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-medium text-sm ${item.isPicked ? 'line-through text-muted-foreground' : ''}`}>
              {item.product?.name || 'Product'}
            </h4>
            <span className="text-sm font-semibold text-primary">
              ₵{parseFloat(item.unitPrice).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            Quantity: {item.quantity} {item.product?.unit || ''}
          </p>
          {item.notes && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 text-amber-500" />
              <span className="text-xs text-amber-600">{item.notes}</span>
            </div>
          )}
          {item.substitutedWith && (
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="secondary" className="text-xs">
                Substituted: {item.substitutedWith}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'kayayo_accepted':
      return 'bg-blue-100 text-blue-800';
    case 'shopping':
      return 'bg-orange-100 text-orange-800';
    case 'ready':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'kayayo_accepted':
      return 'Accepted';
    case 'shopping':
      return 'Shopping';
    case 'ready':
      return 'Ready for Pickup';
    default:
      return status;
  }
}