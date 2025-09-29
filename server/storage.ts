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
import bcrypt from "bcrypt";
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, like, and } from 'drizzle-orm';
import * as schema from '@shared/schema';

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
    const saltRounds = 12;
    
    // Create sample users - each with individually hashed passwords for unique salts
    const buyerId = randomUUID();
    const buyer: User = {
      id: buyerId,
      phone: "+233244123456",
      name: "John Mensah",
      userType: "buyer",
      password: bcrypt.hashSync("password123", saltRounds),
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
      password: bcrypt.hashSync("password123", saltRounds),
      profileImage: null,
      isVerified: true,
      isOnline: true,
      rating: "4.80",
      totalOrders: 142,
      createdAt: new Date(),
    };
    this.users.set(sellerId1, seller1);

    const sellerId2 = randomUUID();
    const seller2: User = {
      id: sellerId2,
      phone: "+233244777888",
      name: "Uncle Kwame",
      userType: "seller",
      password: bcrypt.hashSync("password123", saltRounds),
      profileImage: null,
      isVerified: true,
      isOnline: true,
      rating: "4.65",
      totalOrders: 98,
      createdAt: new Date(),
    };
    this.users.set(sellerId2, seller2);

    const sellerId3 = randomUUID();
    const seller3: User = {
      id: sellerId3,
      phone: "+233244999000",
      name: "Mama Ama",
      userType: "seller",
      password: bcrypt.hashSync("password123", saltRounds),
      profileImage: null,
      isVerified: true,
      isOnline: true,
      rating: "4.90",
      totalOrders: 234,
      createdAt: new Date(),
    };
    this.users.set(sellerId3, seller3);

    // Create seller profiles
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

    const sellerData2: Seller = {
      id: randomUUID(),
      userId: sellerId2,
      stallName: "Kwame's Roots & Tubers",
      stallLocation: "Section B, Row 2",
      market: "Makola",
      specialties: ["Yam", "cassava", "plantain"],
      openingHours: { start: "05:30", end: "17:30" },
      languages: ["English", "Twi", "Ga"],
      verificationBadge: true,
    };
    this.sellers.set(sellerData2.id, sellerData2);

    const sellerData3: Seller = {
      id: randomUUID(),
      userId: sellerId3,
      stallName: "Ama's Fish & Seafood",
      stallLocation: "Section C, Row 1",
      market: "Makola",
      specialties: ["Fresh tilapia", "dried fish", "shrimp"],
      openingHours: { start: "05:00", end: "16:00" },
      languages: ["English", "Ga"],
      verificationBadge: true,
    };
    this.sellers.set(sellerData3.id, sellerData3);

    // Create sample products
    const products = [
      // Akosua's vegetables
      {
        sellerId: sellerData1.id,
        name: "Fresh Tomatoes",
        category: "vegetables",
        unit: "per basket",
        price: "25.00",
        description: "Fresh, ripe tomatoes from local farms",
      },
      {
        sellerId: sellerData1.id,
        name: "Red Onions",
        category: "vegetables", 
        unit: "per bag",
        price: "18.00",
        description: "Sweet red onions, perfect for cooking",
      },
      {
        sellerId: sellerData1.id,
        name: "Hot Peppers",
        category: "spices",
        unit: "per cup",
        price: "8.00",
        description: "Spicy hot peppers for your dishes",
      },
      {
        sellerId: sellerData1.id,
        name: "Garden Eggs",
        category: "vegetables",
        unit: "per bowl",
        price: "12.00",
        description: "Fresh garden eggs, locally grown",
      },
      // Kwame's roots & tubers
      {
        sellerId: sellerData2.id,
        name: "White Yam",
        category: "roots",
        unit: "per tuber",
        price: "15.00",
        description: "Quality white yam, perfect for fufu",
      },
      {
        sellerId: sellerData2.id,
        name: "Cassava",
        category: "roots",
        unit: "per tuber",
        price: "8.00",
        description: "Fresh cassava for gari or cooking",
      },
      {
        sellerId: sellerData2.id,
        name: "Ripe Plantain",
        category: "roots",
        unit: "per bunch",
        price: "20.00", 
        description: "Sweet ripe plantain ready to cook",
      },
      {
        sellerId: sellerData2.id,
        name: "Green Plantain",
        category: "roots",
        unit: "per bunch",
        price: "18.00",
        description: "Unripe plantain for kelewele or boiling",
      },
      // Ama's fish & seafood
      {
        sellerId: sellerData3.id,
        name: "Fresh Tilapia",
        category: "fish",
        unit: "per fish",
        price: "22.00",
        description: "Fresh tilapia from Lake Volta",
      },
      {
        sellerId: sellerData3.id,
        name: "Dried Herrings",
        category: "fish",
        unit: "per pack",
        price: "35.00",
        description: "Smoked dried herrings for soup",
      },
      {
        sellerId: sellerData3.id,
        name: "Fresh Shrimp",
        category: "fish",
        unit: "per cup",
        price: "45.00",
        description: "Fresh shrimp from the coast",
      },
    ];

    products.forEach((product) => {
      const productId = randomUUID();
      const productData: Product = {
        id: productId,
        ...product,
        image: null,
        isAvailable: true,
        allowSubstitution: true,
      };
      this.products.set(productId, productData);
    });

    // Create sample kayayos
    const kayayos = [
      {
        name: "Adwoa",
        phone: "+233244555666",
        rating: "4.60",
        totalOrders: 89,
        location: "Section A",
      },
      {
        name: "Akosua",
        phone: "+233244555777",
        rating: "4.75",
        totalOrders: 156,
        location: "Section B",
      },
      {
        name: "Efua",
        phone: "+233244555888",
        rating: "4.85",
        totalOrders: 203,
        location: "Section C",
      },
    ];

    kayayos.forEach((kayayo) => {
      const kayayoId = randomUUID();
      const kayayoUser: User = {
        id: kayayoId,
        phone: kayayo.phone,
        name: kayayo.name,
        userType: "kayayo",
        password: bcrypt.hashSync("password123", saltRounds),
        profileImage: null,
        isVerified: true,
        isOnline: Math.random() > 0.3, // 70% chance of being online
        rating: kayayo.rating,
        totalOrders: kayayo.totalOrders,
        createdAt: new Date(),
      };
      this.users.set(kayayoId, kayayoUser);

      const kayayoAvail: KayayoAvailability = {
        id: randomUUID(),
        kayayoId: kayayoId,
        market: "Makola",
        isAvailable: Math.random() > 0.2, // 80% chance of being available
        currentLocation: kayayo.location,
        maxOrders: Math.floor(Math.random() * 3) + 2, // 2-4 max orders
        currentOrders: Math.floor(Math.random() * 2), // 0-1 current orders
      };
      this.kayayoAvailability.set(kayayoId, kayayoAvail);
    });

    // Create sample riders
    const riders = [
      {
        name: "Kwaku",
        phone: "+233244666777",
        rating: "4.70",
        totalOrders: 145,
      },
      {
        name: "Kofi",
        phone: "+233244666888",
        rating: "4.55",
        totalOrders: 112,
      },
    ];

    riders.forEach((rider) => {
      const riderId = randomUUID();
      const riderUser: User = {
        id: riderId,
        phone: rider.phone,
        name: rider.name,
        userType: "rider",
        password: bcrypt.hashSync("password123", saltRounds),
        profileImage: null,
        isVerified: true,
        isOnline: Math.random() > 0.4, // 60% chance of being online
        rating: rider.rating,
        totalOrders: rider.totalOrders,
        createdAt: new Date(),
      };
      this.users.set(riderId, riderUser);
    });

    // Create sample orders to demonstrate different workflow states
    this.createSampleOrders();
  }

  private createSampleOrders() {
    const buyerUser = Array.from(this.users.values()).find(u => u.userType === 'buyer');
    const sellerUsers = Array.from(this.users.values()).filter(u => u.userType === 'seller');
    const kayayoUsers = Array.from(this.users.values()).filter(u => u.userType === 'kayayo');
    const riderUsers = Array.from(this.users.values()).filter(u => u.userType === 'rider');
    
    if (!buyerUser || sellerUsers.length === 0) return;

    const sellers = Array.from(this.sellers.values());
    const products = Array.from(this.products.values());

    // Sample Order 1: Pending order (just placed by buyer)
    const order1Id = randomUUID();
    const order1: Order = {
      id: order1Id,
      buyerId: buyerUser.id,
      kayayoId: null,
      riderId: null,
      status: "pending",
      totalAmount: "43.00",
      deliveryAddress: "East Legon, Accra - Near Shell Station",
      deliveryFee: "8.00",
      kayayoFee: "5.00",
      platformFee: "2.00",
      estimatedDeliveryTime: 90,
      paymentMethod: "momo",
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      confirmedAt: null,
      deliveredAt: null
    };
    this.orders.set(order1Id, order1);

    // Order items for Order 1
    const orderItem1Id = randomUUID();
    const orderItem1: OrderItem = {
      id: orderItem1Id,
      orderId: order1Id,
      productId: products[0].id, // Fresh Tomatoes
      sellerId: products[0].sellerId,
      quantity: 2,
      unitPrice: products[0].price,
      subtotal: "50.00",
      notes: "Please select the ripest ones",
      isConfirmed: false,
      isPicked: false,
      substitutedWith: null
    };
    this.orderItems.set(orderItem1Id, orderItem1);

    // Sample Order 2: Accepted by seller, ready for kayayo
    const order2Id = randomUUID();
    const order2: Order = {
      id: order2Id,
      buyerId: buyerUser.id,
      kayayoId: null,
      riderId: null,
      status: "accepted",
      totalAmount: "65.00",
      deliveryAddress: "Tema Station - Near the main market entrance",
      deliveryFee: "12.00",
      kayayoFee: "8.00",
      platformFee: "3.00",
      estimatedDeliveryTime: 120,
      paymentMethod: "cash",
      createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      confirmedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      deliveredAt: null
    };
    this.orders.set(order2Id, order2);

    // Order items for Order 2
    const orderItem2Id = randomUUID();
    const orderItem2: OrderItem = {
      id: orderItem2Id,
      orderId: order2Id,
      productId: products[4].id, // White Yam
      sellerId: products[4].sellerId,
      quantity: 3,
      unitPrice: products[4].price,
      subtotal: "45.00",
      notes: "Medium sized yams please",
      isConfirmed: true,
      isPicked: false,
      substitutedWith: null
    };
    this.orderItems.set(orderItem2Id, orderItem2);

    // Sample Order 3: Kayayo shopping (in progress)
    const order3Id = randomUUID();
    const activeKayayo = kayayoUsers[0];
    const order3: Order = {
      id: order3Id,
      buyerId: buyerUser.id,
      kayayoId: activeKayayo?.id || null,
      riderId: null,
      status: "shopping",
      totalAmount: "78.00",
      deliveryAddress: "Spintex Road - Opposite the Police Station",
      deliveryFee: "15.00",
      kayayoFee: "10.00",
      platformFee: "3.00",
      estimatedDeliveryTime: 140,
      paymentMethod: "momo",
      createdAt: new Date(Date.now() - 90 * 60 * 1000), // 1.5 hours ago
      confirmedAt: new Date(Date.now() - 75 * 60 * 1000), // 1 hour 15 minutes ago
      deliveredAt: null
    };
    this.orders.set(order3Id, order3);

    // Order items for Order 3
    const orderItem3aId = randomUUID();
    const orderItem3a: OrderItem = {
      id: orderItem3aId,
      orderId: order3Id,
      productId: products[8].id, // Fresh Tilapia
      sellerId: products[8].sellerId,
      quantity: 2,
      unitPrice: products[8].price,
      subtotal: "44.00",
      notes: "Clean and cut please",
      isConfirmed: true,
      isPicked: true,
      substitutedWith: null
    };
    this.orderItems.set(orderItem3aId, orderItem3a);

    const orderItem3bId = randomUUID();
    const orderItem3b: OrderItem = {
      id: orderItem3bId,
      orderId: order3Id,
      productId: products[1].id, // Red Onions
      sellerId: products[1].sellerId,
      quantity: 1,
      unitPrice: products[1].price,
      subtotal: "18.00",
      notes: null,
      isConfirmed: true,
      isPicked: false, // Still shopping for this
      substitutedWith: null
    };
    this.orderItems.set(orderItem3bId, orderItem3b);

    // Sample Order 4: Ready for pickup (waiting for rider)
    const order4Id = randomUUID();
    const completedKayayo = kayayoUsers[1];
    const order4: Order = {
      id: order4Id,
      buyerId: buyerUser.id,
      kayayoId: completedKayayo?.id || null,
      riderId: null,
      status: "ready_for_pickup",
      totalAmount: "92.00",
      deliveryAddress: "Airport Residential Area - House No. 45B",
      deliveryFee: "18.00",
      kayayoFee: "12.00",
      platformFee: "4.00",
      estimatedDeliveryTime: 160,
      paymentMethod: "momo",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      confirmedAt: new Date(Date.now() - 105 * 60 * 1000), // 1 hour 45 minutes ago
      deliveredAt: null
    };
    this.orders.set(order4Id, order4);

    // Order items for Order 4 (all picked)
    const orderItem4Id = randomUUID();
    const orderItem4: OrderItem = {
      id: orderItem4Id,
      orderId: order4Id,
      productId: products[9].id, // Dried Herrings
      sellerId: products[9].sellerId,
      quantity: 2,
      unitPrice: products[9].price,
      subtotal: "70.00",
      notes: "Extra dried please",
      isConfirmed: true,
      isPicked: true,
      substitutedWith: null
    };
    this.orderItems.set(orderItem4Id, orderItem4);

    // Sample Order 5: Out for delivery
    const order5Id = randomUUID();
    const deliveryKayayo = kayayoUsers[2];
    const activeRider = riderUsers[0];
    const order5: Order = {
      id: order5Id,
      buyerId: buyerUser.id,
      kayayoId: deliveryKayayo?.id || null,
      riderId: activeRider?.id || null,
      status: "in_transit",
      totalAmount: "54.00",
      deliveryAddress: "Dansoman - Last Stop, Blue House",
      deliveryFee: "10.00",
      kayayoFee: "7.00",
      platformFee: "2.00",
      estimatedDeliveryTime: 100,
      paymentMethod: "cash",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      confirmedAt: new Date(Date.now() - 165 * 60 * 1000), // 2 hours 45 minutes ago
      deliveredAt: null
    };
    this.orders.set(order5Id, order5);

    // Order items for Order 5
    const orderItem5Id = randomUUID();
    const orderItem5: OrderItem = {
      id: orderItem5Id,
      orderId: order5Id,
      productId: products[6].id, // Ripe Plantain
      sellerId: products[6].sellerId,
      quantity: 1,
      unitPrice: products[6].price,
      subtotal: "20.00",
      notes: "Very ripe for boiling",
      isConfirmed: true,
      isPicked: true,
      substitutedWith: null
    };
    this.orderItems.set(orderItem5Id, orderItem5);

    // Sample Order 6: Delivered (completed)
    const order6Id = randomUUID();
    const pastKayayo = kayayoUsers[0];
    const pastRider = riderUsers[1];
    const order6: Order = {
      id: order6Id,
      buyerId: buyerUser.id,
      kayayoId: pastKayayo?.id || null,
      riderId: pastRider?.id || null,
      status: "delivered",
      totalAmount: "37.00",
      deliveryAddress: "Kaneshie Market - Behind the main lorry station",
      deliveryFee: "6.00",
      kayayoFee: "4.00",
      platformFee: "2.00",
      estimatedDeliveryTime: 80,
      paymentMethod: "momo",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      confirmedAt: new Date(Date.now() - 23.5 * 60 * 60 * 1000), // 23.5 hours ago
      deliveredAt: new Date(Date.now() - 22 * 60 * 60 * 1000) // 22 hours ago
    };
    this.orders.set(order6Id, order6);

    // Order items for Order 6
    const orderItem6Id = randomUUID();
    const orderItem6: OrderItem = {
      id: orderItem6Id,
      orderId: order6Id,
      productId: products[2].id, // Hot Peppers
      sellerId: products[2].sellerId,
      quantity: 3,
      unitPrice: products[2].price,
      subtotal: "24.00",
      notes: "Not too spicy please",
      isConfirmed: true,
      isPicked: true,
      substitutedWith: null
    };
    this.orderItems.set(orderItem6Id, orderItem6);
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
      estimatedDeliveryTime: insertOrder.estimatedDeliveryTime || null,
      paymentMethod: insertOrder.paymentMethod || null
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
    // Get orders that have items from this seller
    const orderItemsForSeller = Array.from(this.orderItems.values()).filter(item => item.sellerId === sellerId);
    const uniqueOrderIds = new Set(orderItemsForSeller.map(item => item.orderId));
    const orderIds = Array.from(uniqueOrderIds);
    
    return Array.from(this.orders.values()).filter(order => orderIds.includes(order.id));
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

export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for PostgreSQL storage');
    }
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql, { schema });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, userUpdate: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(schema.users).set(userUpdate).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async getUsersByType(userType: string): Promise<User[]> {
    return await this.db.select().from(schema.users).where(eq(schema.users.userType, userType));
  }

  // Sellers
  async getSeller(id: string): Promise<Seller | undefined> {
    const result = await this.db.select().from(schema.sellers).where(eq(schema.sellers.id, id)).limit(1);
    return result[0];
  }

  async getSellerByUserId(userId: string): Promise<Seller | undefined> {
    const result = await this.db.select().from(schema.sellers).where(eq(schema.sellers.userId, userId)).limit(1);
    return result[0];
  }

  async createSeller(insertSeller: InsertSeller): Promise<Seller> {
    const result = await this.db.insert(schema.sellers).values(insertSeller).returning();
    return result[0];
  }

  async updateSeller(id: string, sellerUpdate: Partial<Seller>): Promise<Seller | undefined> {
    const result = await this.db.update(schema.sellers).set(sellerUpdate).where(eq(schema.sellers.id, id)).returning();
    return result[0];
  }

  async getSellersByMarket(market: string): Promise<Seller[]> {
    return await this.db.select().from(schema.sellers).where(eq(schema.sellers.market, market));
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    const result = await this.db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const result = await this.db.insert(schema.products).values(insertProduct).returning();
    return result[0];
  }

  async updateProduct(id: string, productUpdate: Partial<Product>): Promise<Product | undefined> {
    const result = await this.db.update(schema.products).set(productUpdate).where(eq(schema.products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await this.db.delete(schema.products).where(eq(schema.products.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getProductsBySeller(sellerId: string): Promise<Product[]> {
    return await this.db.select().from(schema.products).where(eq(schema.products.sellerId, sellerId));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await this.db.select().from(schema.products).where(eq(schema.products.category, category));
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await this.db.select().from(schema.products).where(like(schema.products.name, `%${query}%`));
  }

  // Cart
  async getCartItems(buyerId: string): Promise<CartItem[]> {
    return await this.db.select().from(schema.cartItems).where(eq(schema.cartItems.buyerId, buyerId));
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    const result = await this.db.insert(schema.cartItems).values(insertCartItem).returning();
    return result[0];
  }

  async updateCartItem(id: string, cartItemUpdate: Partial<CartItem>): Promise<CartItem | undefined> {
    const result = await this.db.update(schema.cartItems).set(cartItemUpdate).where(eq(schema.cartItems.id, id)).returning();
    return result[0];
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await this.db.delete(schema.cartItems).where(eq(schema.cartItems.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async clearCart(buyerId: string): Promise<boolean> {
    const result = await this.db.delete(schema.cartItems).where(eq(schema.cartItems.buyerId, buyerId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    const result = await this.db.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
    return result[0];
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const result = await this.db.insert(schema.orders).values(insertOrder).returning();
    return result[0];
  }

  async updateOrder(id: string, orderUpdate: Partial<Order>): Promise<Order | undefined> {
    const result = await this.db.update(schema.orders).set(orderUpdate).where(eq(schema.orders.id, id)).returning();
    return result[0];
  }

  async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    return await this.db.select().from(schema.orders).where(eq(schema.orders.buyerId, buyerId));
  }

  async getOrdersBySeller(sellerId: string): Promise<Order[]> {
    // This requires a join with order_items to find orders containing products from this seller
    const result = await this.db
      .select({
        id: schema.orders.id,
        buyerId: schema.orders.buyerId,
        kayayoId: schema.orders.kayayoId,
        riderId: schema.orders.riderId,
        status: schema.orders.status,
        totalAmount: schema.orders.totalAmount,
        deliveryAddress: schema.orders.deliveryAddress,
        deliveryFee: schema.orders.deliveryFee,
        kayayoFee: schema.orders.kayayoFee,
        platformFee: schema.orders.platformFee,
        estimatedDeliveryTime: schema.orders.estimatedDeliveryTime,
        paymentMethod: schema.orders.paymentMethod,
        createdAt: schema.orders.createdAt,
        confirmedAt: schema.orders.confirmedAt,
        deliveredAt: schema.orders.deliveredAt,
      })
      .from(schema.orders)
      .innerJoin(schema.orderItems, eq(schema.orders.id, schema.orderItems.orderId))
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .where(eq(schema.products.sellerId, sellerId));
    
    return result;
  }

  async getOrdersByKayayo(kayayoId: string): Promise<Order[]> {
    return await this.db.select().from(schema.orders).where(eq(schema.orders.kayayoId, kayayoId));
  }

  async getOrdersByRider(riderId: string): Promise<Order[]> {
    return await this.db.select().from(schema.orders).where(eq(schema.orders.riderId, riderId));
  }

  async getPendingOrders(): Promise<Order[]> {
    return await this.db.select().from(schema.orders).where(eq(schema.orders.status, 'pending'));
  }

  // Order Items
  async getOrderItem(id: string): Promise<OrderItem | undefined> {
    const result = await this.db.select().from(schema.orderItems).where(eq(schema.orderItems.id, id)).limit(1);
    return result[0];
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const result = await this.db.insert(schema.orderItems).values(insertOrderItem).returning();
    return result[0];
  }

  async updateOrderItem(id: string, orderItemUpdate: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const result = await this.db.update(schema.orderItems).set(orderItemUpdate).where(eq(schema.orderItems.id, id)).returning();
    return result[0];
  }

  async getOrderItemsByOrder(orderId: string): Promise<OrderItem[]> {
    return await this.db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  }

  // Reviews
  async getReview(id: string): Promise<Review | undefined> {
    const result = await this.db.select().from(schema.reviews).where(eq(schema.reviews.id, id)).limit(1);
    return result[0];
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const result = await this.db.insert(schema.reviews).values(insertReview).returning();
    return result[0];
  }

  async getReviewsByReviewee(revieweeId: string): Promise<Review[]> {
    return await this.db.select().from(schema.reviews).where(eq(schema.reviews.revieweeId, revieweeId));
  }

  async getReviewsByOrder(orderId: string): Promise<Review[]> {
    return await this.db.select().from(schema.reviews).where(eq(schema.reviews.orderId, orderId));
  }

  // Kayayo Availability
  async getKayayoAvailability(kayayoId: string): Promise<KayayoAvailability | undefined> {
    const result = await this.db.select().from(schema.kayayoAvailability).where(eq(schema.kayayoAvailability.kayayoId, kayayoId)).limit(1);
    return result[0];
  }

  async createKayayoAvailability(insertAvailability: InsertKayayoAvailability): Promise<KayayoAvailability> {
    const result = await this.db.insert(schema.kayayoAvailability).values(insertAvailability).returning();
    return result[0];
  }

  async updateKayayoAvailability(kayayoId: string, availabilityUpdate: Partial<KayayoAvailability>): Promise<KayayoAvailability | undefined> {
    const result = await this.db.update(schema.kayayoAvailability).set(availabilityUpdate).where(eq(schema.kayayoAvailability.kayayoId, kayayoId)).returning();
    return result[0];
  }

  async getAvailableKayayos(market: string): Promise<KayayoAvailability[]> {
    return await this.db.select().from(schema.kayayoAvailability).where(
      and(
        eq(schema.kayayoAvailability.market, market),
        eq(schema.kayayoAvailability.isAvailable, true)
      )
    );
  }
}

export const storage = new PostgresStorage();
