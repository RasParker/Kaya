export interface SellerWithUser {
  id: string;
  userId: string;
  stallName: string;
  stallLocation: string;
  market: string;
  specialties: string[];
  openingHours: { start: string; end: string };
  languages: string[];
  verificationBadge: boolean;
  user: {
    id: string;
    name: string;
    phone: string;
    rating: string;
    totalOrders: number;
    isOnline: boolean;
    profileImage?: string;
  };
}

export interface ProductWithSeller {
  id: string;
  sellerId: string;
  name: string;
  category: string;
  unit: string;
  price: string;
  image?: string;
  isAvailable: boolean;
  allowSubstitution: boolean;
  description?: string;
  seller?: SellerWithUser;
}

export interface CartItemWithProduct {
  id: string;
  buyerId: string;
  productId: string;
  quantity: number;
  notes?: string;
  allowSubstitution: boolean;
  product: ProductWithSeller;
}

export interface OrderWithItems {
  id: string;
  buyerId: string;
  kayayoId?: string;
  riderId?: string;
  status: string;
  totalAmount: string;
  deliveryAddress: string;
  deliveryFee: string;
  kayayoFee: string;
  platformFee: string;
  estimatedDeliveryTime?: number;
  createdAt: string | Date;
  confirmedAt?: string | Date;
  deliveredAt?: string | Date;
  items?: OrderItemWithProduct[];
}

export interface OrderItemWithProduct {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  notes?: string;
  isConfirmed: boolean;
  isPicked: boolean;
  substitutedWith?: string;
  product: ProductWithSeller;
}

export interface KayayoWithUser {
  id: string;
  kayayoId: string;
  market: string;
  isAvailable: boolean;
  currentLocation?: string;
  maxOrders: number;
  currentOrders: number;
  user: {
    id: string;
    name: string;
    phone: string;
    rating: string;
    totalOrders: number;
    isOnline: boolean;
    profileImage?: string;
  };
}
