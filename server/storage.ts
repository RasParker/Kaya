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
  type InsertKayayoAvailability,
  type Dispute,
  type InsertDispute,
  type DeliveryAddress,
  type InsertDeliveryAddress
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { eq, like, and, asc, desc, isNull } from 'drizzle-orm';
import * as schema from '@shared/schema';

const { Pool } = pg;

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
  getAllProducts(): Promise<Product[]>;
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
  acceptDeliveryAsRider(orderId: string, riderId: string): Promise<Order | undefined>;
  getOrdersByBuyer(buyerId: string): Promise<Order[]>;
  getOrdersBySeller(sellerId: string): Promise<Order[]>;
  getOrdersByKayayo(kayayoId: string): Promise<Order[]>;
  getOrdersByRider(riderId: string): Promise<Order[]>;
  getOrdersForRider(riderId: string): Promise<Order[]>;
  getPendingOrders(): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;

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

  // Disputes
  getDispute(id: string): Promise<Dispute | undefined>;
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  updateDispute(id: string, dispute: Partial<Dispute>): Promise<Dispute | undefined>;
  getAllDisputes(): Promise<Dispute[]>;
  getDisputesByOrder(orderId: string): Promise<Dispute[]>;
  getDisputesByStatus(status: string): Promise<Dispute[]>;

  // Delivery Addresses
  getDeliveryAddress(id: string): Promise<DeliveryAddress | undefined>;
  getDeliveryAddressesByUser(userId: string): Promise<DeliveryAddress[]>;
  createDeliveryAddress(address: InsertDeliveryAddress): Promise<DeliveryAddress>;
  updateDeliveryAddress(id: string, address: Partial<DeliveryAddress>): Promise<DeliveryAddress | undefined>;
  deleteDeliveryAddress(id: string): Promise<boolean>;
  setDefaultAddress(userId: string, addressId: string): Promise<void>;
}


export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private pool: InstanceType<typeof Pool>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for PostgreSQL storage');
    }
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.db = drizzle(this.pool, { schema });
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
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

  async getAllProducts(): Promise<Product[]> {
    return await this.db.select().from(schema.products).orderBy(desc(schema.products.createdAt));
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
    return await this.db.select().from(schema.products).where(eq(schema.products.sellerId, sellerId)).orderBy(desc(schema.products.createdAt));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await this.db.select().from(schema.products).where(eq(schema.products.category, category)).orderBy(desc(schema.products.createdAt));
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await this.db.select().from(schema.products).where(like(schema.products.name, `%${query}%`)).orderBy(desc(schema.products.createdAt));
  }

  // Cart
  async getCartItems(buyerId: string): Promise<CartItem[]> {
    return await this.db.select().from(schema.cartItems).where(eq(schema.cartItems.buyerId, buyerId)).orderBy(asc(schema.cartItems.id));
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

  async acceptDeliveryAsRider(orderId: string, riderId: string): Promise<Order | undefined> {
    const result = await this.db
      .update(schema.orders)
      .set({
        riderId,
        status: "in_transit"
      })
      .where(
        and(
          eq(schema.orders.id, orderId),
          eq(schema.orders.status, 'ready_for_pickup'),
          isNull(schema.orders.riderId)
        )
      )
      .returning();
    return result[0];
  }

  async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    return await this.db.select().from(schema.orders).where(eq(schema.orders.buyerId, buyerId));
  }

  async getOrdersBySeller(sellerId: string): Promise<Order[]> {
    // This requires a join with order_items to find orders containing products from this seller
    const result = await this.db
      .selectDistinct({
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

  async getOrdersForRider(riderId: string): Promise<Order[]> {
    const assignedOrders = await this.db.select().from(schema.orders).where(eq(schema.orders.riderId, riderId));
    const availableOrders = await this.db.select().from(schema.orders).where(
      and(
        isNull(schema.orders.riderId),
        eq(schema.orders.status, 'ready_for_pickup')
      )
    );
    return [...assignedOrders, ...availableOrders];
  }

  async getPendingOrders(): Promise<Order[]> {
    return await this.db.select().from(schema.orders).where(eq(schema.orders.status, 'pending'));
  }

  async getPendingOrdersBySeller(sellerId: string): Promise<Order[]> {
    const result = await this.db
      .selectDistinct({
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
      .where(and(
        eq(schema.products.sellerId, sellerId),
        eq(schema.orders.status, 'pending')
      ));
    
    return result;
  }

  async getAllOrders(): Promise<Order[]> {
    return await this.db.select().from(schema.orders);
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

  // Disputes
  async getDispute(id: string): Promise<Dispute | undefined> {
    const result = await this.db.select().from(schema.disputes).where(eq(schema.disputes.id, id)).limit(1);
    return result[0];
  }

  async createDispute(insertDispute: InsertDispute): Promise<Dispute> {
    const result = await this.db.insert(schema.disputes).values(insertDispute).returning();
    return result[0];
  }

  async updateDispute(id: string, disputeUpdate: Partial<Dispute>): Promise<Dispute | undefined> {
    const result = await this.db.update(schema.disputes).set(disputeUpdate).where(eq(schema.disputes.id, id)).returning();
    return result[0];
  }

  async getAllDisputes(): Promise<Dispute[]> {
    return await this.db.select().from(schema.disputes);
  }

  async getDisputesByOrder(orderId: string): Promise<Dispute[]> {
    return await this.db.select().from(schema.disputes).where(eq(schema.disputes.orderId, orderId));
  }

  async getDisputesByStatus(status: string): Promise<Dispute[]> {
    return await this.db.select().from(schema.disputes).where(eq(schema.disputes.status, status));
  }

  // Delivery Addresses
  async getDeliveryAddress(id: string): Promise<DeliveryAddress | undefined> {
    const result = await this.db.select().from(schema.deliveryAddresses).where(eq(schema.deliveryAddresses.id, id)).limit(1);
    return result[0];
  }

  async getDeliveryAddressesByUser(userId: string): Promise<DeliveryAddress[]> {
    return await this.db.select().from(schema.deliveryAddresses).where(eq(schema.deliveryAddresses.userId, userId)).orderBy(desc(schema.deliveryAddresses.isDefault));
  }

  async createDeliveryAddress(insertAddress: InsertDeliveryAddress): Promise<DeliveryAddress> {
    const result = await this.db.insert(schema.deliveryAddresses).values(insertAddress).returning();
    return result[0];
  }

  async updateDeliveryAddress(id: string, addressUpdate: Partial<DeliveryAddress>): Promise<DeliveryAddress | undefined> {
    const result = await this.db.update(schema.deliveryAddresses).set(addressUpdate).where(eq(schema.deliveryAddresses.id, id)).returning();
    return result[0];
  }

  async deleteDeliveryAddress(id: string): Promise<boolean> {
    const result = await this.db.delete(schema.deliveryAddresses).where(eq(schema.deliveryAddresses.id, id)).returning();
    return result.length > 0;
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    await this.db.update(schema.deliveryAddresses).set({ isDefault: false }).where(eq(schema.deliveryAddresses.userId, userId));
    await this.db.update(schema.deliveryAddresses).set({ isDefault: true }).where(eq(schema.deliveryAddresses.id, addressId));
  }
}

export const storage = new PostgresStorage();
