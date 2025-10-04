import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Order } from "@shared/schema";

export default function SellerWithdraw() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("momo");
  const [momoNumber, setMomoNumber] = useState(user?.phone || "");

  // Fetch orders to calculate balance
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  // Calculate available balance
  const totalEarnings = Array.isArray(orders) 
    ? orders.reduce((sum: number, order: any) => {
        return order.status === 'delivered' ? sum + parseFloat(order.totalAmount || 0) : sum;
      }, 0)
    : 0;
  
  const withdrawnAmount = 0; // This would come from withdrawal records in real app
  const availableBalance = totalEarnings - withdrawnAmount;

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; method: string; momoNumber?: string }) => {
      // In a real app, this would create a withdrawal request
      // For now, we'll just simulate it
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, message: "Withdrawal request submitted" });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal request submitted!",
        description: "Your withdrawal will be processed within 1-2 business days.",
      });
      setLocation("/seller/dashboard");
    },
    onError: () => {
      toast({
        title: "Failed to submit withdrawal",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance to withdraw this amount.",
        variant: "destructive",
      });
      return;
    }

    if (amount < 10) {
      toast({
        title: "Minimum withdrawal amount",
        description: "Minimum withdrawal amount is ₵10.00",
        variant: "destructive",
      });
      return;
    }

    if (withdrawMethod === 'momo' && !momoNumber) {
      toast({
        title: "Mobile money number required",
        description: "Please enter your mobile money number.",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({
      amount,
      method: withdrawMethod,
      momoNumber: withdrawMethod === 'momo' ? momoNumber : undefined,
    });
  };

  const quickAmounts = [50, 100, 200, 500];

  if (!user || user.userType !== 'seller') {
    setLocation('/login');
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
            onClick={() => setLocation("/seller/dashboard")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Withdraw Funds</h1>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-20">
        {/* Available Balance Card */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-green-600" data-testid="text-available-balance">
                ₵{availableBalance.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Withdraw Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Withdrawal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Withdraw Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount to Withdraw (₵)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  data-testid="input-withdraw-amount"
                  required
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="space-y-2">
                <Label>Quick Select</Label>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawAmount(amount.toString())}
                      disabled={amount > availableBalance}
                      data-testid={`button-quick-amount-${amount}`}
                    >
                      ₵{amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Withdrawal Method */}
              <div className="space-y-2">
                <Label>Withdrawal Method</Label>
                <RadioGroup value={withdrawMethod} onValueChange={setWithdrawMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="momo" id="momo" />
                    <Label htmlFor="momo" className="cursor-pointer">Mobile Money (MoMo)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="cursor-pointer">Bank Transfer (Coming Soon)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Mobile Money Number */}
              {withdrawMethod === 'momo' && (
                <div className="space-y-2">
                  <Label htmlFor="momo-number">Mobile Money Number</Label>
                  <Input
                    id="momo-number"
                    type="tel"
                    placeholder="+233 XX XXX XXXX"
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    data-testid="input-momo-number"
                    required
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Important Information */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Minimum withdrawal amount is ₵10.00
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Withdrawals are processed within 1-2 business days
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    A small processing fee may apply
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={withdrawMutation.isPending}
            data-testid="button-submit-withdrawal"
          >
            {withdrawMutation.isPending ? (
              "Processing..."
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Submit Withdrawal Request
              </>
            )}
          </Button>
        </form>
      </main>
    </MobileLayout>
  );
}
