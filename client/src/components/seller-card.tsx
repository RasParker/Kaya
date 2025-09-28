import { Star, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SellerCardProps {
  seller: {
    id: string;
    user: {
      name: string;
      rating: string;
      totalOrders: number;
      isOnline: boolean;
      profileImage?: string;
    };
    specialties: string[];
  };
  onClick: () => void;
}

export default function SellerCard({ seller, onClick }: SellerCardProps) {
  const { user, specialties } = seller;
  
  return (
    <div 
      className="seller-card bg-card border border-border rounded-lg p-4 shadow-sm cursor-pointer"
      onClick={onClick}
      data-testid={`card-seller-${seller.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Profile Image */}
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {user.profileImage ? (
            <img 
              src={user.profileImage} 
              alt={`${user.name} profile`} 
              className="w-full h-full object-cover"
              data-testid={`img-seller-profile-${seller.id}`}
            />
          ) : (
            <span className="text-lg font-semibold text-muted-foreground">
              {user.name.charAt(0)}
            </span>
          )}
        </div>
        
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm" data-testid={`text-seller-name-${seller.id}`}>
              {user.name}
            </h3>
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground ml-1" data-testid={`text-seller-rating-${seller.id}`}>
                  {parseFloat(user.rating).toFixed(1)}
                </span>
              </div>
              <Circle 
                className={`w-2 h-2 ${user.isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`}
                data-testid={`status-seller-online-${seller.id}`}
              />
            </div>
          </div>
          
          {/* Specialties */}
          <p className="text-xs text-muted-foreground mb-2" data-testid={`text-seller-specialties-${seller.id}`}>
            {specialties?.join(", ") || "Fresh groceries"}
          </p>
          
          {/* Stats and Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                <span data-testid={`text-seller-orders-${seller.id}`}>
                  {user.totalOrders} orders
                </span>
              </Badge>
              <span className="text-xs text-muted-foreground">~45 min</span>
            </div>
            <Button 
              size="sm" 
              className="text-xs h-7 px-3"
              data-testid={`button-view-seller-${seller.id}`}
            >
              View Items
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
