import { 
  type User, 
  type InsertUser,
  type Seller,
  type InsertSeller,
  type Product,
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Review,
  type InsertReview,
  type KayayoAvailability,
  type InsertKayayoAvailability
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  getUsersByType(userType: string): Promise<User[]>;

  // Sellers
  getSeller(id: string): Promise<Seller | undefined>;
  getSellerByUserId(userId: string): Promise<Seller | undefined>;
  createSeller(seller: InsertSeller): Promise<Seller>;
  updateSeller(id: string, seller: Partial<Seller>): Promise<Seller | undefined>;
  getSellersByMarket(market: string): Promise<Seller[]>;

  // Products
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getProductsBySeller(sellerId: string): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;

  // Cart
  getCartItems(buyerId: string): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, cartItem: Partial<CartItem>): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(buyerId: string): Promise<boolean>;

  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<Order>): Promise<Order | undefined>;
  getOrdersByBuyer(buyerId: string): Promise<Order[]>;
  getOrdersBySeller(sellerId: string): Promise<Order[]>;
  getOrdersByKayayo(kayayoId: string): Promise<Order[]>;
  getOrdersByRider(riderId: string): Promise<Order[]>;
  getPendingOrders(): Promise<Order[]>;

  // Order Items
  getOrderItem(id: string): Promise<OrderItem | undefined>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: string, orderItem: Partial<OrderItem>): Promise<OrderItem | undefined>;
  getOrderItemsByOrder(orderId: string): Promise<OrderItem[]>;

  // Reviews
  getReview(id: string): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByReviewee(revieweeId: string): Promise<Review[]>;
  getReviewsByOrder(orderId: string): Promise<Review[]>;

  // Kayayo Availability
  getKayayoAvailability(kayayoId: string): Promise<KayayoAvailability | undefined>;
  createKayayoAvailability(availability: InsertKayayoAvailability): Promise<KayayoAvailability>;
  updateKayayoAvailability(kayayoId: string, availability: Partial<KayayoAvailability>): Promise<KayayoAvailability | undefined>;
  getAvailableKayayos(market: string): Promise<KayayoAvailability[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sellers: Map<string, Seller>;
  private products: Map<string, Product>;
  private cartItems: Map<string, CartItem>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;
  private reviews: Map<string, Review>;
  private kayayoAvailability: Map<string, KayayoAvailability>;

  constructor() {
    this.users = new Map();
    this.sellers = new Map();
    this.products = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.reviews = new Map();
    this.kayayoAvailability = new Map();
    this.seedData();
  }

  private seedData() {
    // Create sample users
    const buyerId = randomUUID();
    const buyer: User = {
      id: buyerId,
      phone: "+233244123456",
      name: "John Mensah",
      userType: "buyer",
      password: "password123",
      profileImage: null,
      isVerified: true,
      isOnline: true,
      rating: "0.00",
      totalOrders: 0,
      createdAt: new Date(),
    };
    this.users.set(buyerId, buyer);

    // Create sample sellers
    const sellerId1 = randomUUID();
    const seller1: User = {
      id: sellerId1,
      phone: "+233244987654",
      name: "Auntie Akosua",
      userType: "seller",
      password: "password123",
      profileImage: null,
      isVerified: true,
      isOnline: true,
      rating: "4.80",
      totalOrders: 142,
      createdAt: new Date(),
    };
    this.users.set(sellerId1, seller1);

    const sellerData1: Seller = {
      id: randomUUID(),
      userId: sellerId1,
      stallName: "Akosua's Fresh Vegetables",
      stallLocation: "Section A, Row 5",
      market: "Makola",
      specialties: ["Fresh tomatoes", "onions", "peppers"],
      openingHours: { start: "06:00", end: "18:00" },
      languages: ["English", "Twi"],
      verificationBadge: true,
    };
    this.sellers.set(sellerData1.id, sellerData1);

    // Create sample products
    const productId1 = randomUUID();
    const product1: Product = {
      id: productId1,
      sellerId: sellerData1.id,
      name: "Fresh Tomatoes",
      category: "vegetables",
      unit: "per basket",
      price: "25.00",
      image: null,
      isAvailable: true,
      allowSubstitution: true,
      description: "Fresh, ripe tomatoes from local farms",
    };
    this.products.set(productId1, product1);

    // Create sample kayayos
    const kayayoId1 = randomUUID();
    const kayayo1: User = {
      id: kayayoId1,
      phone: "+233244555666",
      name: "Adwoa",
      userType: "kayayo",
      password: "password123",
      profileImage: null,
      isVerified: true,
      isOnline: true,
      rating: "4.60",
      totalOrders: 89,
      createdAt: new Date(),
    };
    this.users.set(kayayoId1, kayayo1);

    const kayayoAvail1: KayayoAvailability = {
      id: randomUUID(),
      kayayoId: kayayoId1,
      market: "Makola",
      isAvailable: true,
      currentLocation: "Section A",
      maxOrders: 3,
      currentOrders: 0,
    };
    this.kayayoAvailability.set(kayayoId1, kayayoAvail1);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      rating: "0.00",
      totalOrders: 0,
      createdAt: new Date(),
      profileImage: insertUser.profileImage || null,
      isVerified: insertUser.isVerified || false,
      isOnline: insertUser.isOnline || false
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersByType(userType: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.userType === userType);
  }

  // Sellers
  async getSeller(id: string): Promise<Seller | undefined> {
    return this.sellers.get(id);
  }

  async getSellerByUserId(userId: string): Promise<Seller | undefined> {
    return Array.from(this.sellers.values()).find(seller => seller.userId === userId);
  }

  async createSeller(insertSeller: InsertSeller): Promise<Seller> {
    const id = randomUUID();
    const seller: Seller = { 
      ...insertSeller, 
      id,
      market: insertSeller.market || "Makola",
      specialties: insertSeller.specialties || null,
      openingHours: insertSeller.openingHours || null,
      languages: insertSeller.languages || null,
      verificationBadge: insertSeller.verificationBadge || false
    };
    this.sellers.set(id, seller);
    return seller;
  }

  async updateSeller(id: string, sellerUpdate: Partial<Seller>): Promise<Seller | undefined> {
    const seller = this.sellers.get(id);
    if (!seller) return undefined;
    
    const updatedSeller = { ...seller, ...sellerUpdate };
    this.sellers.set(id, updatedSeller);
    return updatedSeller;
  }

  async getSellersByMarket(market: string): Promise<Seller[]> {
    return Array.from(this.sellers.values()).filter(seller => seller.market === market);
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      ...insertProduct, 
      id,
      image: insertProduct.image || null,
      isAvailable: insertProduct.isAvailable || true,
      allowSubstitution: insertProduct.allowSubstitution || true,
      description: insertProduct.description || null
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, productUpdate: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...productUpdate };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async getProductsBySeller(sellerId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.sellerId === sellerId);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.category === category);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(product => 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Cart
  async getCartItems(buyerId: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.buyerId === buyerId);
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    const id = randomUUID();
    const cartItem: CartItem = { 
      ...insertCartItem, 
      id,
      notes: insertCartItem.notes || null,
      allowSubstitution: insertCartItem.allowSubstitution || true
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItem(id: string, cartItemUpdate: Partial<CartItem>): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;
    
    const updatedCartItem = { ...cartItem, ...cartItemUpdate };
    this.cartItems.set(id, updatedCartItem);
    return updatedCartItem;
  }

  async removeFromCart(id: string): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(buyerId: string): Promise<boolean> {
    const cartItems = Array.from(this.cartItems.entries()).filter(([_, item]) => item.buyerId === buyerId);
    cartItems.forEach(([id]) => this.cartItems.delete(id));
    return true;
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = { 
      ...insertOrder, 
      id, 
      createdAt: new Date(),
      confirmedAt: null,
      deliveredAt: null,
      status: insertOrder.status || "pending",
      kayayoId: insertOrder.kayayoId || null,
      riderId: insertOrder.riderId || null,
      deliveryFee: insertOrder.deliveryFee || "0.00",
      kayayoFee: insertOrder.kayayoFee || "0.00",
      platformFee: insertOrder.platformFee || "0.00",
      estimatedDeliveryTime: insertOrder.estimatedDeliveryTime || null
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, orderUpdate: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, ...orderUpdate };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.buyerId === buyerId);
  }

  async getOrdersBySeller(sellerId: string): Promise<Order[]> {
    // This would need to be implemented by joining with order items
    return [];
  }

  async getOrdersByKayayo(kayayoId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.kayayoId === kayayoId);
  }

  async getOrdersByRider(riderId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.riderId === riderId);
  }

  async getPendingOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.status === "pending");
  }

  // Order Items
  async getOrderItem(id: string): Promise<OrderItem | undefined> {
    return this.orderItems.get(id);
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = randomUUID();
    const orderItem: OrderItem = { 
      ...insertOrderItem, 
      id,
      notes: insertOrderItem.notes || null,
      isConfirmed: insertOrderItem.isConfirmed || false,
      isPicked: insertOrderItem.isPicked || false,
      substitutedWith: insertOrderItem.substitutedWith || null
    };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  async updateOrderItem(id: string, orderItemUpdate: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const orderItem = this.orderItems.get(id);
    if (!orderItem) return undefined;
    
    const updatedOrderItem = { ...orderItem, ...orderItemUpdate };
    this.orderItems.set(id, updatedOrderItem);
    return updatedOrderItem;
  }

  async getOrderItemsByOrder(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  // Reviews
  async getReview(id: string): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = randomUUID();
    const review: Review = { 
      ...insertReview, 
      id, 
      createdAt: new Date(),
      comment: insertReview.comment || null,
      tags: insertReview.tags || null
    };
    this.reviews.set(id, review);
    return review;
  }

  async getReviewsByReviewee(revieweeId: string): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.revieweeId === revieweeId);
  }

  async getReviewsByOrder(orderId: string): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.orderId === orderId);
  }

  // Kayayo Availability
  async getKayayoAvailability(kayayoId: string): Promise<KayayoAvailability | undefined> {
    return this.kayayoAvailability.get(kayayoId);
  }

  async createKayayoAvailability(insertAvailability: InsertKayayoAvailability): Promise<KayayoAvailability> {
    const id = randomUUID();
    const availability: KayayoAvailability = { 
      ...insertAvailability, 
      id,
      isAvailable: insertAvailability.isAvailable || true,
      currentLocation: insertAvailability.currentLocation || null,
      maxOrders: insertAvailability.maxOrders || 3,
      currentOrders: insertAvailability.currentOrders || 0
    };
    this.kayayoAvailability.set(insertAvailability.kayayoId, availability);
    return availability;
  }

  async updateKayayoAvailability(kayayoId: string, availabilityUpdate: Partial<KayayoAvailability>): Promise<KayayoAvailability | undefined> {
    const availability = this.kayayoAvailability.get(kayayoId);
    if (!availability) return undefined;
    
    const updatedAvailability = { ...availability, ...availabilityUpdate };
    this.kayayoAvailability.set(kayayoId, updatedAvailability);
    return updatedAvailability;
  }

  async getAvailableKayayos(market: string): Promise<KayayoAvailability[]> {
    return Array.from(this.kayayoAvailability.values()).filter(
      availability => availability.market === market && availability.isAvailable
    );
  }
}

export const storage = new MemStorage();
