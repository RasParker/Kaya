import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  FileText,
  Image,
} from "lucide-react";
import type { Dispute } from "@shared/schema";

interface DisputeWithDetails extends Dispute {
  orderTotal?: number;
  reporterName?: string;
  reportedAgainstName?: string;
}

export default function AdminDisputes() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithDetails | null>(null);
  const [resolution, setResolution] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("");

  const { data: disputes = [], isLoading } = useQuery<DisputeWithDetails[]>({
    queryKey: ["/api/admin/disputes"],
    refetchInterval: 30000,
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: async (data: {
      disputeId: string;
      status: "resolved" | "rejected";
      resolution: string;
      refundAmount?: number;
      penaltyAmount?: number;
    }) => {
      const response = await apiRequest("POST", `/api/admin/disputes/${data.disputeId}/resolve`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedDispute(null);
      setResolution("");
      setRefundAmount("");
      setPenaltyAmount("");
      toast({
        title: "Dispute resolved",
        description: "The dispute has been resolved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve dispute.",
        variant: "destructive",
      });
    },
  });

  if (!user || user.userType !== 'admin') {
    setLocation('/login');
    return null;
  }

  const filteredDisputes = disputes.filter((dispute) => {
    return statusFilter === "all" || dispute.status === statusFilter;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisputeTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'missing_items': return 'bg-red-100 text-red-800';
      case 'late_delivery': return 'bg-orange-100 text-orange-800';
      case 'wrong_items': return 'bg-yellow-100 text-yellow-800';
      case 'quality_issue': return 'bg-purple-100 text-purple-800';
      case 'payment_issue': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResolve = (status: "resolved" | "rejected") => {
    if (!selectedDispute) return;

    const refund = refundAmount ? parseFloat(refundAmount) : undefined;
    const penalty = penaltyAmount ? parseFloat(penaltyAmount) : undefined;

    resolveDisputeMutation.mutate({
      disputeId: selectedDispute.id,
      status,
      resolution,
      refundAmount: refund,
      penaltyAmount: penalty,
    });
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
              <h1 className="text-3xl font-bold text-primary" data-testid="admin-disputes-title">
                Dispute Resolution
              </h1>
              <p className="text-sm text-muted-foreground">Review and resolve customer complaints</p>
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
                Total Disputes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="stat-total-disputes">
                {disputes.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-disputes">
                {disputes.filter(d => d.status === 'pending').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Under Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600" data-testid="stat-under-review">
                {disputes.filter(d => d.status === 'under_review').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600" data-testid="stat-resolved">
                {disputes.filter(d => d.status === 'resolved').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-64" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Disputes</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Disputes Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-bold">{filteredDisputes.length}</span> of {disputes.length} disputes
          </p>
        </div>

        {/* Disputes Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispute ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Against</TableHead>
                    <TableHead>Order Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading disputes...
                      </TableCell>
                    </TableRow>
                  ) : filteredDisputes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No disputes found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDisputes.map((dispute) => (
                      <TableRow key={dispute.id} data-testid={`dispute-row-${dispute.id}`}>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {dispute.id.substring(0, 8)}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDisputeTypeBadgeColor(dispute.disputeType)}>
                            {dispute.disputeType.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{dispute.reporterName || 'Unknown'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{dispute.reportedAgainstName || 'N/A'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">₵{dispute.orderTotal?.toFixed(2) || '0.00'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(dispute.status)}>
                            {dispute.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(dispute.createdAt!).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDispute(dispute)}
                            data-testid={`button-review-${dispute.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
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

      {/* Review Dispute Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Dispute</DialogTitle>
            <DialogDescription>
              Review the dispute details and provide a resolution
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4">
              {/* Dispute Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Dispute Type</p>
                  <Badge className={getDisputeTypeBadgeColor(selectedDispute.disputeType)}>
                    {selectedDispute.disputeType.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusBadgeColor(selectedDispute.status)}>
                    {selectedDispute.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reporter</p>
                  <p className="font-medium">{selectedDispute.reporterName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reported Against</p>
                  <p className="font-medium">{selectedDispute.reportedAgainstName || 'N/A'}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-medium mb-2">Description</p>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                  {selectedDispute.description}
                </p>
              </div>

              {/* Evidence */}
              {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Evidence Attached
                  </p>
                  <div className="flex gap-2">
                    {selectedDispute.evidence.map((url, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <Image className="h-4 w-4 mr-1" />
                        View {idx + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Form */}
              {selectedDispute.status !== 'resolved' && selectedDispute.status !== 'rejected' && (
                <>
                  <div>
                    <label className="text-sm font-medium">Resolution Notes</label>
                    <Textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Enter resolution details..."
                      className="mt-1"
                      rows={3}
                      data-testid="textarea-resolution"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Refund Amount (₵)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="0.00"
                        className="mt-1"
                        data-testid="input-refund"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Penalty Amount (₵)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={penaltyAmount}
                        onChange={(e) => setPenaltyAmount(e.target.value)}
                        placeholder="0.00"
                        className="mt-1"
                        data-testid="input-penalty"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Existing Resolution */}
              {selectedDispute.resolution && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-2">Resolution</p>
                  <p className="text-sm text-green-800">{selectedDispute.resolution}</p>
                  {selectedDispute.refundAmount && (
                    <p className="text-sm text-green-800 mt-2">
                      Refund: ₵{parseFloat(selectedDispute.refundAmount).toFixed(2)}
                    </p>
                  )}
                  {selectedDispute.penaltyAmount && (
                    <p className="text-sm text-green-800">
                      Penalty: ₵{parseFloat(selectedDispute.penaltyAmount).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedDispute?.status !== 'resolved' && selectedDispute?.status !== 'rejected' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleResolve("rejected")}
                  disabled={resolveDisputeMutation.isPending || !resolution}
                  data-testid="button-reject-dispute"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Dispute
                </Button>
                <Button
                  onClick={() => handleResolve("resolved")}
                  disabled={resolveDisputeMutation.isPending || !resolution}
                  data-testid="button-resolve-dispute"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve Dispute
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
