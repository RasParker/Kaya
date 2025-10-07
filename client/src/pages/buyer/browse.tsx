import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Filter, Plus, ArrowLeft, X, Minus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { SkeletonProductCard } from "@/components/ui/skeleton";
import LoadingSpinner from "@/components/ui/loading-spinner";
import type { Product } from "@shared/schema";

// Carousel component for displaying multiple product images
const ImageCarousel = ({ images, productName }: { images: string[]; productName: string }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <span className="text-8xl">🥬</span>
      </div>
    );
  }

  const totalImages = images.length;
  const maxImagesToShow = 4; // As per requirement, max 4 images

  return (
    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
      <img
        src={images[currentImageIndex]}
        alt={`${productName} - Image ${currentImageIndex + 1}`}
        className="w-full h-full object-cover"
        data-testid="modal-product-image"
      />
      {totalImages > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {images.slice(0, maxImagesToShow).map((_, index) => (
            <button
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === currentImageIndex ? "bg-primary" : "bg-gray-400"
              }`}
              onClick={() => setCurrentImageIndex(index)}
              aria-label={`Go to image ${index + 1}`}
              data-testid={`button-image-dot-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Browse() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Reset quantity when modal opens with a new product
  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1);
    }
  }, [selectedProduct]);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract seller from URL query parameter
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const sellerId = params.get('sellerId');

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { 
      category: selectedCategory === "all" ? undefined : selectedCategory, 
      search: searchQuery || undefined,
      sellerId: sellerId || undefined
    }],
    enabled: true,
  });

  // Use the user ID directly as buyer ID since buyers are stored in the users table
  const buyerId = user?.userType === 'buyer' ? user.id : undefined;

  // Fetch seller info when product is selected
  const { data: sellerInfo } = useQuery({
    queryKey: ["/api/sellers", selectedProduct?.sellerId],
    queryFn: async () => {
      if (!selectedProduct?.sellerId) return null;
      const response = await fetch(`/api/sellers/${selectedProduct.sellerId}`);
      return response.json();
    },
    enabled: !!selectedProduct?.sellerId,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      setAddingProductId(productId);
      const response = await apiRequest("POST", "/api/cart", {
        buyerId,
        productId,
        quantity,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart.",
      });
      setAddingProductId(null);
    },
    onError: () => {
      toast({
        title: "Failed to add to cart",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      setAddingProductId(null);
    },
  });

  const categories = [
    { id: "all", name: "All Items" },
    { id: "vegetables", name: "Vegetables" },
    { id: "fruits", name: "Fruits" },
    { id: "roots", name: "Roots & Tubers" },
    { id: "fish", name: "Fish & Seafood" },
    { id: "grains", name: "Grains" },
    { id: "spices", name: "Spices" },
    { id: "household", name: "Household" },
  ];

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Browse Products</h1>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-10 bg-muted border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-products"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "secondary"}
                size="sm"
                className={`category-chip whitespace-nowrap ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'
                }`}
                onClick={() => setSelectedCategory(category.id)}
                data-testid={`button-category-${category.id}`}
              >
                {category.name}
              </Button>
            );
          })}
        </div>
      </header>

      {/* Products Grid */}
      <main className="p-4 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <SkeletonProductCard />
            <SkeletonProductCard />
            <SkeletonProductCard />
            <SkeletonProductCard />
            <SkeletonProductCard />
            <SkeletonProductCard />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={() => {
                  setSelectedProduct(product);
                  setIsModalOpen(true);
                }}
                onAddToCart={() => addToCartMutation.mutate({ productId: product.id, quantity: 1 })}
                isAddingToCart={addingProductId === product.id}
                buyerId={buyerId}
              />
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">{selectedProduct.name}</DialogTitle>
                <DialogDescription className="sr-only">{selectedProduct.description || "No description available"}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Product Image Carousel */}
                <ImageCarousel 
                  images={(selectedProduct.images && selectedProduct.images.length > 0) 
                    ? selectedProduct.images 
                    : (selectedProduct.image ? [selectedProduct.image] : [])} 
                  productName={selectedProduct.name} 
                />

                {/* Product Title and Description */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProduct.description || "No description available"}</p>
                </div>

                {/* Product Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="font-bold text-xl text-primary">
                      ₵{parseFloat(selectedProduct.price).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Unit</span>
                    <span className="text-sm font-medium">{selectedProduct.unit}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <Badge variant="secondary">{selectedProduct.category}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Availability</span>
                    {selectedProduct.isAvailable ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Out of Stock
                      </Badge>
                    )}
                  </div>

                  {selectedProduct.allowSubstitution && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <span className="text-xs text-muted-foreground">
                        ✓ Substitution allowed if unavailable
                      </span>
                    </div>
                  )}
                </div>

                

                {/* Add to Cart Button */}
                <Button
                  className="w-full"
                  disabled={!selectedProduct.isAvailable || !buyerId || addingProductId === selectedProduct.id || (selectedProduct.stockQty ?? 0) < 1}
                  onClick={() => {
                    addToCartMutation.mutate({ productId: selectedProduct.id, quantity });
                    setIsModalOpen(false);
                  }}
                  data-testid="modal-add-to-cart"
                >
                  {addingProductId === selectedProduct.id ? (
                    <>
                      <LoadingSpinner size="sm" className="w-4 h-4 mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}

function ProductCard({ 
  product, 
  onClick,
  onAddToCart, 
  isAddingToCart, 
  buyerId 
}: { 
  product: Product;
  onClick: () => void;
  onAddToCart: () => void; 
  isAddingToCart: boolean; 
  buyerId?: string; 
}) {
  return (
    <Card className="overflow-hidden cursor-pointer" data-testid={`card-product-${product.id}`} onClick={onClick}>
      <CardContent className="p-3">
        {/* Product Image */}
        <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
              data-testid={`img-product-${product.id}`}
            />
          ) : (
            <span className="text-4xl">🥬</span>
          )}
        </div>

        {/* Product Info */}
        <h3 className="font-semibold text-sm mb-1" data-testid={`text-product-name-${product.id}`}>
          {product.name}
        </h3>

        <p className="text-xs text-muted-foreground mb-3" data-testid={`text-product-unit-${product.id}`}>
          {product.unit}
        </p>

        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
            ₵{parseFloat(product.price).toFixed(2)}
          </span>
          {product.isAvailable ? (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              Available
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
              Out of Stock
            </Badge>
          )}
        </div>

        <Button
          variant="default"
          size="sm"
          className="w-full text-xs h-8"
          disabled={!product.isAvailable || !buyerId || isAddingToCart}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
          data-testid={`button-add-to-cart-${product.id}`}
        >
          {isAddingToCart ? (
            <>
              <LoadingSpinner size="sm" className="w-3 h-3 mr-1" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-3 h-3 mr-1" />
              Add to Cart
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}