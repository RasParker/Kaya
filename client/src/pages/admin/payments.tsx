import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DollarSign,
  ArrowLeft,
  Lock,
  Unlock,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
} from "lucide-react";

interface PaymentStats {
  held: number;
  released: number;
  pending: number;
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
}

interface PaymentTransaction {
  id: string;
  orderId: string;
  buyerName: string;
  amount: number;
  platformFee: number;
  status: "held" | "released" | "pending" | "frozen";
  paymentMethod: string;
  createdAt: string;
  releasedAt?: string;
}

export default function AdminPayments() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [paymentToFreeze, setPaymentToFreeze] = useState<PaymentTransaction | null>(null);

  const { data: stats } = useQuery<PaymentStats>({
    queryKey: ["/api/admin/payments/stats"],
    refetchInterval: 30000,
  });

  const { data: transactions = [], isLoading } = useQuery<PaymentTransaction[]>({
    queryKey: ["/api/admin/payments/transactions"],
    refetchInterval: 30000,
  });

  const freezePaymentMutation = useMutation({
    mutationFn: async ({ orderId, freeze }: { orderId: string; freeze: boolean }) => {
      const response = await apiRequest("POST", `/api/admin/payments/${orderId}/freeze`, { freeze });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments/stats"] });
      setPaymentToFreeze(null);
      toast({
        title: variables.freeze ? "Payment frozen" : "Payment unfrozen",
        description: variables.freeze
          ? "Payment has been frozen for review."
          : "Payment has been released for processing.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payment status.",
        variant: "destructive",
      });
    },
  });

  const exportReportMutation = useMutation({
    mutationFn: async (period: "week" | "month") => {
      const response = await apiRequest("GET", `/api/admin/payments/export?period=${period}`, {});
      return response.blob();
    },
    onSuccess: (blob, period) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Report exported",
        description: `${period}ly payment report has been downloaded.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export report.",
        variant: "destructive",
      });
    },
  });

  if (!user || user.userType !== 'admin') {
    setLocation('/login');
    return null;
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'held': return 'bg-yellow-100 text-yellow-800';
      case 'released': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'frozen': return 'bg-red-100 text-red-800';
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
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-primary" data-testid="admin-payments-title">
                Payments & Escrow
              </h1>
              <p className="text-sm text-muted-foreground">Manage platform payments and transactions</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => exportReportMutation.mutate("week")}
                disabled={exportReportMutation.isPending}
                data-testid="button-export-week"
              >
                <Download className="h-4 w-4 mr-2" />
                Weekly Report
              </Button>
              <Button
                variant="outline"
                onClick={() => exportReportMutation.mutate("month")}
                disabled={exportReportMutation.isPending}
                data-testid="button-export-month"
              >
                <Download className="h-4 w-4 mr-2" />
                Monthly Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-900 flex items-center justify-between">
                <span>Held in Escrow</span>
                <Lock className="h-5 w-5 text-yellow-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-900" data-testid="stat-held">
                ₵{stats?.held.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-yellow-700 mt-1">Awaiting delivery confirmation</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-900 flex items-center justify-between">
                <span>Released</span>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-900" data-testid="stat-released">
                ₵{stats?.released.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-green-700 mt-1">Successfully processed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-900 flex items-center justify-between">
                <span>Pending</span>
                <Clock className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-900" data-testid="stat-pending">
                ₵{stats?.pending.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-blue-700 mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-900 flex items-center justify-between">
                <span>Total Revenue</span>
                <DollarSign className="h-5 w-5 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-900" data-testid="stat-total-revenue">
                ₵{stats?.totalRevenue.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-purple-700 mt-1">Platform fees collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Today's Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₵{stats?.todayRevenue.toFixed(2) || '0.00'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₵{stats?.weekRevenue.toFixed(2) || '0.00'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₵{stats?.monthRevenue.toFixed(2) || '0.00'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Platform Fee</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading transactions...
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No transactions found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id} data-testid={`transaction-row-${transaction.id}`}>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {transaction.orderId.substring(0, 8)}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{transaction.buyerName}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold">₵{transaction.amount.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-purple-600 font-medium">
                            ₵{transaction.platformFee.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.status === "held" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPaymentToFreeze(transaction)}
                              data-testid={`button-freeze-${transaction.id}`}
                            >
                              {transaction.status === "frozen" ? (
                                <>
                                  <Unlock className="h-4 w-4 mr-1" />
                                  Unfreeze
                                </>
                              ) : (
                                <>
                                  <Lock className="h-4 w-4 mr-1" />
                                  Freeze
                                </>
                              )}
                            </Button>
                          )}
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

      {/* Freeze Payment Dialog */}
      <AlertDialog open={!!paymentToFreeze} onOpenChange={() => setPaymentToFreeze(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Freeze Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to freeze this payment for ₵{paymentToFreeze?.amount.toFixed(2)}?
              This will prevent automatic release until manually reviewed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (paymentToFreeze) {
                  freezePaymentMutation.mutate({
                    orderId: paymentToFreeze.orderId,
                    freeze: paymentToFreeze.status !== "frozen"
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-freeze"
            >
              Freeze Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
