import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Order, OrderItem, Product, User } from "@shared/schema";

interface ReviewDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order;
}

interface ReviewFormData {
  revieweeId: string;
  reviewType: 'seller' | 'kayayo' | 'rider';
  rating: number;
  comment: string;
  tags: string[];
}

export default function ReviewDialog({ open, onClose, order }: ReviewDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [reviews, setReviews] = useState<ReviewFormData[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // Fetch order items to determine sellers
  const { data: orderItems = [], isLoading: orderItemsLoading } = useQuery<OrderItem[]>({
    queryKey: ['/api/orders', order.id, 'items'],
    enabled: open,
  });

  // Fetch products to get seller IDs
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: open && orderItems.length > 0,
  });

  // Fetch kayayo and rider user info
  const { data: kayayo } = useQuery<User>({
    queryKey: ['/api/users', order.kayayoId],
    enabled: open && !!order.kayayoId,
  });

  const { data: rider } = useQuery<User>({
    queryKey: ['/api/users', order.riderId],
    enabled: open && !!order.riderId,
  });

  // Initialize reviews when data is loaded
  useEffect(() => {
    if (open && orderItems.length > 0 && products.length > 0) {
      const sellerIds = new Set<string>();
      orderItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product?.sellerId) sellerIds.add(product.sellerId);
      });

      const newReviews: ReviewFormData[] = [];
      
      // Add seller reviews
      sellerIds.forEach(sellerId => {
        newReviews.push({
          revieweeId: sellerId,
          reviewType: 'seller',
          rating: 0,
          comment: '',
          tags: []
        });
      });

      // Add kayayo review
      if (order.kayayoId) {
        newReviews.push({
          revieweeId: order.kayayoId,
          reviewType: 'kayayo',
          rating: 0,
          comment: '',
          tags: []
        });
      }

      // Add rider review
      if (order.riderId) {
        newReviews.push({
          revieweeId: order.riderId,
          reviewType: 'rider',
          rating: 0,
          comment: '',
          tags: []
        });
      }

      setReviews(newReviews);
      setCurrentReviewIndex(0);
    }
  }, [open, orderItems, products, order.kayayoId, order.riderId]);

  const submitReviewsMutation = useMutation({
    mutationFn: async () => {
      const validReviews = reviews.filter(r => r.rating > 0);
      
      const promises = validReviews.map(review =>
        apiRequest("POST", "/api/reviews", {
          orderId: order.id,
          revieweeId: review.revieweeId,
          reviewType: review.reviewType,
          rating: review.rating,
          comment: review.comment || undefined,
          tags: review.tags.length > 0 ? review.tags : undefined,
        })
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Reviews submitted!",
        description: "Thank you for your feedback.",
      });
      onClose();
      setReviews([]);
      setCurrentReviewIndex(0);
    },
    onError: () => {
      toast({
        title: "Failed to submit reviews",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const isLoading = orderItemsLoading || productsLoading || (open && reviews.length === 0 && (orderItems.length > 0 || products.length > 0));
  const currentReview = reviews[currentReviewIndex];

  const handleRatingClick = (rating: number) => {
    const newReviews = [...reviews];
    newReviews[currentReviewIndex].rating = rating;
    setReviews(newReviews);
  };

  const handleCommentChange = (comment: string) => {
    const newReviews = [...reviews];
    newReviews[currentReviewIndex].comment = comment;
    setReviews(newReviews);
  };

  const handleTagToggle = (tag: string) => {
    const newReviews = [...reviews];
    const tags = newReviews[currentReviewIndex].tags;
    if (tags.includes(tag)) {
      newReviews[currentReviewIndex].tags = tags.filter(t => t !== tag);
    } else {
      newReviews[currentReviewIndex].tags = [...tags, tag];
    }
    setReviews(newReviews);
  };

  const handleNext = () => {
    if (currentReviewIndex < reviews.length - 1) {
      setCurrentReviewIndex(currentReviewIndex + 1);
    } else {
      submitReviewsMutation.mutate();
    }
  };

  const handleSkip = () => {
    if (currentReviewIndex < reviews.length - 1) {
      setCurrentReviewIndex(currentReviewIndex + 1);
    } else {
      const hasAnyReviews = reviews.some(r => r.rating > 0);
      if (hasAnyReviews) {
        submitReviewsMutation.mutate();
      } else {
        onClose();
        setReviews([]);
        setCurrentReviewIndex(0);
      }
    }
  };

  const getRevieweeName = () => {
    if (!currentReview) return '';
    
    if (currentReview.reviewType === 'seller') {
      const orderItem = orderItems.find(item => {
        const product = products.find(p => p.id === item.productId);
        return product?.sellerId === currentReview.revieweeId;
      });
      return orderItem ? 'Seller' : 'Seller';
    } else if (currentReview.reviewType === 'kayayo') {
      return kayayo?.name || 'Kayayo';
    } else {
      return rider?.name || 'Rider';
    }
  };

  const getTagsForType = (type: string) => {
    if (type === 'seller') {
      return ['Fresh Products', 'Good Quality', 'Fair Prices', 'Well Packaged', 'Friendly'];
    } else if (type === 'kayayo') {
      return ['Careful Handling', 'Quick Shopping', 'Good Communication', 'Polite', 'Reliable'];
    } else {
      return ['On Time', 'Careful Delivery', 'Polite', 'Good Communication', 'Professional'];
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md" data-testid="dialog-review">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
        </DialogHeader>

        {isLoading || !currentReview ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading review form...</p>
          </div>
        ) : (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Review {currentReviewIndex + 1} of {reviews.length}
            </p>
            <h3 className="text-lg font-semibold" data-testid="text-reviewee-name">
              Rate {getRevieweeName()}
            </h3>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingClick(star)}
                className="focus:outline-none"
                data-testid={`button-star-${star}`}
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= currentReview.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Quick Tags */}
          {currentReview.rating > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Quick feedback (optional)</p>
              <div className="flex flex-wrap gap-2">
                {getTagsForType(currentReview.reviewType).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      currentReview.tags.includes(tag)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary"
                    }`}
                    data-testid={`button-tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comment */}
          {currentReview.rating > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Additional comments (optional)</p>
              <Textarea
                placeholder="Share your experience..."
                value={currentReview.comment}
                onChange={(e) => handleCommentChange(e.target.value)}
                className="min-h-[80px]"
                data-testid="textarea-comment"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
              disabled={submitReviewsMutation.isPending}
              data-testid="button-skip"
            >
              Skip
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1"
              disabled={currentReview.rating === 0 || submitReviewsMutation.isPending}
              data-testid="button-next"
            >
              {submitReviewsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : currentReviewIndex < reviews.length - 1 ? (
                "Next"
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
