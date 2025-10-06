import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { Order } from "@shared/schema";

interface DisputeDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order;
}

const disputeTypes = [
  { value: 'missing_items', label: 'Missing Items', description: 'Some items were not delivered' },
  { value: 'late_delivery', label: 'Late Delivery', description: 'Order arrived much later than expected' },
  { value: 'wrong_items', label: 'Wrong Items', description: 'Received incorrect items' },
  { value: 'quality_issue', label: 'Quality Issue', description: 'Items are poor quality or damaged' },
  { value: 'payment_issue', label: 'Payment Issue', description: 'Problem with payment or charges' },
  { value: 'other', label: 'Other', description: 'Other issues not listed above' },
];

export default function DisputeDialog({ open, onClose, order }: DisputeDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [disputeType, setDisputeType] = useState('');
  const [description, setDescription] = useState('');
  const [reportedAgainst, setReportedAgainst] = useState<string>('');

  const submitDisputeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const disputeData = {
        orderId: order.id,
        reportedBy: user.id,
        reportedAgainst: reportedAgainst || undefined,
        disputeType,
        description,
        status: 'pending',
      };

      const response = await apiRequest("POST", "/api/disputes", disputeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      toast({
        title: "Issue reported successfully",
        description: "Our team will review your report and get back to you soon.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Failed to submit report",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setDisputeType('');
    setDescription('');
    setReportedAgainst('');
    onClose();
  };

  const handleSubmit = () => {
    if (!disputeType || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please select an issue type and provide a description.",
        variant: "destructive",
      });
      return;
    }
    submitDisputeMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="dialog-dispute">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Report an Issue
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">What's the problem?</Label>
            <RadioGroup value={disputeType} onValueChange={setDisputeType}>
              {disputeTypes.map((type) => (
                <div key={type.value} className="flex items-start space-x-2 mb-2">
                  <RadioGroupItem 
                    value={type.value} 
                    id={type.value}
                    data-testid={`radio-${type.value}`}
                  />
                  <Label htmlFor={type.value} className="cursor-pointer flex-1">
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {disputeType && (
            <>
              <div>
                <Label className="text-sm font-medium mb-2 block">Who is involved? (Optional)</Label>
                <RadioGroup value={reportedAgainst} onValueChange={setReportedAgainst}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="" id="none" data-testid="radio-none" />
                    <Label htmlFor="none" className="cursor-pointer">Not specific to anyone</Label>
                  </div>
                  {order.kayayoId && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={order.kayayoId} id="kayayo" data-testid="radio-kayayo" />
                      <Label htmlFor="kayayo" className="cursor-pointer">Kayayo (Porter)</Label>
                    </div>
                  )}
                  {order.riderId && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={order.riderId} id="rider" data-testid="radio-rider" />
                      <Label htmlFor="rider" className="cursor-pointer">Rider (Delivery)</Label>
                    </div>
                  )}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                  Describe the issue
                </Label>
                <Textarea
                  id="description"
                  placeholder="Please provide details about what happened..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px]"
                  data-testid="textarea-description"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be as specific as possible to help us resolve this quickly
                </p>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={submitDisputeMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!disputeType || !description.trim() || submitDisputeMutation.isPending}
              data-testid="button-submit"
            >
              {submitDisputeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
