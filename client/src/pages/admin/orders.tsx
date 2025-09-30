import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Search,
  ArrowLeft,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  DollarSign,
  Calendar,
  RefreshCw,
} from "lucide-react";
import type { Order } from "@shared/schema";

interface OrderWithDetails extends Order {
  buyerName?: string;
  kayayoName?: string;
  riderName?: string;
  itemCount?: number;
  isDelayed?: boolean;
}

export default function AdminOrders() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [delayFilter, setDelayFilter] = useState<string>("all");
  const [orderToReassign, setOrderToReassign] = useState<OrderWithDetails | null>(null);
  const [reassignType, setReassignType] = useState<"kayayo" | "rider" | null>(null);

  const { data: orders = [], isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/admin/orders"],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const reassignMutation = useMutation({
    mutationFn: async ({ orderId, type }: { orderId: string; type: "kayayo" | "rider" }) => {
      const response = await apiRequest("POST", `/api/admin/orders/${orderId}/reassign`, { type });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setOrderToReassign(null);
      setReassignType(null);
      toast({
        title: "Order reassigned",
        description: "The order has been reassigned successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reassign order.",
        variant: "destructive",
      });
    },
  });

  if (!user || user.userType !== 'admin') {
    setLocation('/login');
    return null;
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = !searchQuery ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    const matchesDelay = delayFilter === "all" ||
      (delayFilter === "delayed" && order.isDelayed) ||
      (delayFilter === "on-time" && !order.isDelayed);

    return matchesSearch && matchesStatus && matchesDelay;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'seller_confirmed': return 'bg-blue-100 text-blue-800';
      case 'kayayo_accepted': return 'bg-purple-100 text-purple-800';
      case 'shopping': return 'bg-indigo-100 text-indigo-800';
      case 'ready_for_pickup': return 'bg-orange-100 text-orange-800';
      case 'in_transit': return 'bg-cyan-100 text-cyan-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/admin/dashboard')}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary" data-testid="admin-orders-title">
                Order Monitoring
              </h1>
              <p className="text-sm text-muted-foreground">Track and manage all orders</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="stat-total-orders">
                {orders.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600" data-testid="stat-active-orders">
                {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Delayed Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600" data-testid="stat-delayed-orders">
                {orders.filter(o => o.isDelayed).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-assignment">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, buyer, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="seller_confirmed">Seller Confirmed</SelectItem>
                  <SelectItem value="kayayo_accepted">Kayayo Accepted</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={delayFilter} onValueChange={setDelayFilter}>
                <SelectTrigger data-testid="select-delay-filter">
                  <SelectValue placeholder="Filter by delay status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="delayed">Delayed Only</SelectItem>
                  <SelectItem value="on-time">On-Time Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-bold">{filteredOrders.length}</span> of {orders.length} orders
          </p>
        </div>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading orders...
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No orders found matching your filters</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id} data-testid={`order-row-${order.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {order.id.substring(0, 8)}
                            </code>
                            {order.isDelayed && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.buyerName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {order.deliveryAddress.substring(0, 30)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(order.status)}>
                            {order.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {order.kayayoName && (
                              <p className="flex items-center gap-1">
                                <User className="h-3 w-3 text-purple-600" />
                                K: {order.kayayoName}
                              </p>
                            )}
                            {order.riderName && (
                              <p className="flex items-center gap-1">
                                <User className="h-3 w-3 text-orange-600" />
                                R: {order.riderName}
                              </p>
                            )}
                            {!order.kayayoName && !order.riderName && (
                              <p className="text-muted-foreground">Unassigned</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">₵{parseFloat(order.totalAmount).toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.createdAt!).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setOrderToReassign(order);
                                setReassignType("kayayo");
                              }}
                              disabled={!order.kayayoId}
                              data-testid={`button-reassign-kayayo-${order.id}`}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Kayayo
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setOrderToReassign(order);
                                setReassignType("rider");
                              }}
                              disabled={!order.riderId}
                              data-testid={`button-reassign-rider-${order.id}`}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Rider
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Reassign Confirmation Dialog */}
      <AlertDialog open={!!orderToReassign} onOpenChange={() => {
        setOrderToReassign(null);
        setReassignType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reassign Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reassign this order to a different {reassignType}?
              The current {reassignType} will be notified of the change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (orderToReassign && reassignType) {
                  reassignMutation.mutate({ orderId: orderToReassign.id, type: reassignType });
                }
              }}
              data-testid="button-confirm-reassign"
            >
              Reassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
