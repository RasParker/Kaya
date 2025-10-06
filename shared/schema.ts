import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for all user types
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").unique(),
  email: text("email").unique(),
  name: text("name").notNull(),
  userType: text("user_type").notNull(), // 'buyer', 'seller', 'kayayo', 'rider', 'admin'
  password: text("password").notNull(),
  profileImage: text("profile_image"),
  isVerified: boolean("is_verified").default(false),
  isOnline: boolean("is_online").default(false),
  isSuspended: boolean("is_suspended").default(false),
  isActive: boolean("is_active").default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalOrders: integer("total_orders").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sellers specific data
export const sellers = pgTable("sellers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  stallName: text("stall_name").notNull(),
  stallLocation: text("stall_location").notNull(),
  market: text("market").notNull().default("Makola"),
  specialties: text("specialties").array(),
  openingHours: json("opening_hours"),
  languages: text("languages").array(),
  verificationBadge: boolean("verification_badge").default(false),
});

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => sellers.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(), // 'per tuber', 'per basket', 'per kg'
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image"),
  images: text("images").array(),
  isAvailable: boolean("is_available").default(true),
  allowSubstitution: boolean("allow_substitution").default(true),
  description: text("description"),
});

// Cart items
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  allowSubstitution: boolean("allow_substitution").default(true),
});

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  kayayoId: varchar("kayayo_id").references(() => users.id),
  riderId: varchar("rider_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, seller_confirmed, kayayo_accepted, shopping, ready_for_pickup, in_transit, delivered, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0.00"),
  kayayoFee: decimal("kayayo_fee", { precision: 10, scale: 2 }).default("0.00"),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).default("0.00"),
  estimatedDeliveryTime: integer("estimated_delivery_time"), // minutes
  paymentMethod: text("payment_method"), // 'momo', 'card', 'cash'
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  deliveredAt: timestamp("delivered_at"),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  sellerId: varchar("seller_id").notNull().references(() => sellers.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  isConfirmed: boolean("is_confirmed").default(false),
  isPicked: boolean("is_picked").default(false),
  substitutedWith: text("substituted_with"),
});

// Reviews and ratings
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  revieweeId: varchar("reviewee_id").notNull().references(() => users.id),
  reviewType: text("review_type").notNull(), // 'seller', 'kayayo', 'rider'
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  tags: text("tags").array(), // ['on-time', 'good-quality', 'polite', etc.]
  createdAt: timestamp("created_at").defaultNow(),
});

// Kayayo availability
export const kayayoAvailability = pgTable("kayayo_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kayayoId: varchar("kayayo_id").notNull().references(() => users.id),
  market: text("market").notNull(),
  isAvailable: boolean("is_available").default(true),
  currentLocation: text("current_location"),
  maxOrders: integer("max_orders").default(3),
  currentOrders: integer("current_orders").default(0),
});

// Disputes
export const disputes = pgTable("disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  reportedBy: varchar("reported_by").notNull().references(() => users.id),
  reportedAgainst: varchar("reported_against").references(() => users.id),
  disputeType: text("dispute_type").notNull(), // 'missing_items', 'late_delivery', 'wrong_items', 'quality_issue', 'payment_issue', 'other'
  status: text("status").notNull().default("pending"), // 'pending', 'under_review', 'resolved', 'rejected'
  description: text("description").notNull(),
  evidence: text("evidence").array(), // URLs to uploaded photos/documents
  resolution: text("resolution"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  penaltyAmount: decimal("penalty_amount", { precision: 10, scale: 2 }),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  rating: true,
  totalOrders: true,
});

export const insertSellerSchema = createInsertSchema(sellers).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
  deliveredAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertKayayoAvailabilitySchema = createInsertSchema(kayayoAvailability).omit({
  id: true,
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSeller = z.infer<typeof insertSellerSchema>;
export type Seller = typeof sellers.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertKayayoAvailability = z.infer<typeof insertKayayoAvailabilitySchema>;
export type KayayoAvailability = typeof kayayoAvailability.$inferSelect;

export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputes.$inferSelect;
