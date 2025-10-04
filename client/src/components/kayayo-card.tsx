import { Star, Circle } from "lucide-react";

interface KayayoCardProps {
  kayayo: {
    id: string;
    kayayoId: string;
    isAvailable: boolean;
    user: {
      name: string;
      rating: string;
      totalOrders: number;
      profileImage?: string;
    };
  };
  onClick?: () => void;
}

export default function KayayoCard({ kayayo, onClick }: KayayoCardProps) {
  const { user, isAvailable } = kayayo;
  
  return (
    <div 
      className={`flex-shrink-0 bg-card border border-border rounded-lg p-3 w-32 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
      data-testid={`card-kayayo-${kayayo.id}`}
    >
      {/* Profile Image */}
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 overflow-hidden">
        {user.profileImage ? (
          <img 
            src={user.profileImage} 
            alt={`${user.name} profile`} 
            className="w-full h-full object-cover"
            data-testid={`img-kayayo-profile-${kayayo.id}`}
          />
        ) : (
          <span className="text-lg font-semibold text-muted-foreground">
            {user.name.charAt(0)}
          </span>
        )}
      </div>
      
      {/* Name */}
      <h4 className="text-xs font-semibold text-center mb-1" data-testid={`text-kayayo-name-${kayayo.id}`}>
        {user.name}
      </h4>
      
      {/* Rating */}
      <div className="flex items-center justify-center gap-1 mb-2">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="text-xs text-muted-foreground" data-testid={`text-kayayo-rating-${kayayo.id}`}>
          {parseFloat(user.rating).toFixed(1)}
        </span>
      </div>
      
      {/* Status */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-1">
          <Circle 
            className={`w-2 h-2 mr-1 ${
              isAvailable 
                ? 'fill-green-500 text-green-500' 
                : 'fill-yellow-500 text-yellow-500'
            }`}
            data-testid={`status-kayayo-available-${kayayo.id}`}
          />
          <span className={`text-xs font-medium ${
            isAvailable ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {isAvailable ? 'Available' : 'Busy'}
          </span>
        </div>
      </div>
      
      {/* Order count */}
      <p className="text-xs text-center text-muted-foreground mt-1" data-testid={`text-kayayo-orders-${kayayo.id}`}>
        {user.totalOrders} orders
      </p>
    </div>
  );
}
