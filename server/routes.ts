import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertUserSchema, insertProductSchema, insertCartItemSchema, insertOrderSchema, insertDeliveryAddressSchema } from "@shared/schema";
import * as schema from "@shared/schema";
import { eq, like, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { OrderStateMachine, OrderStatus, OrderStateError } from "./orderStateMachine";
import { uploadImageToCloudinary, uploadMultipleImagesToCloudinary } from "./cloudinary";

interface AuthenticatedRequest extends Request {
  user?: any;
}

// JWT middleware
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  const jwtSecret = process.env.SESSION_SECRET;
  if (!jwtSecret) {
    console.error('SESSION_SECRET environment variable is required');
    return res.sendStatus(500);
  }

  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');

    if (userId) {
      clients.set(userId, ws);
    }

    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
      }
    });
  });

  // Broadcast function for real-time updates
  const broadcastToUser = (userId: string, message: any) => {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // SECURITY: Prevent public admin creation
      if (userData.userType === 'admin') {
        return res.status(403).json({ message: "Admin accounts cannot be created through public registration" });
      }

      // Validate at least one identifier exists
      if (!userData.phone && !userData.email) {
        return res.status(400).json({ message: "Either phone or email is required" });
      }

      // Check if user already exists by phone
      if (userData.phone) {
        const existingUser = await storage.getUserByPhone(userData.phone);
        if (existingUser) {
          return res.status(400).json({ message: "User with this phone already exists" });
        }
      }

      // Check if user already exists by email
      if (userData.email) {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser) {
          return res.status(400).json({ message: "User with this email already exists" });
        }
      }

      // Hash password before storing
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      const userDataWithHashedPassword = { ...userData, password: hashedPassword };

      const user = await storage.createUser(userDataWithHashedPassword);

      // Create seller profile if user type is seller
      if (user.userType === 'seller' && req.body.sellerData) {
        await storage.createSeller({
          userId: user.id,
          ...req.body.sellerData
        });
      }

      // Create kayayo availability if user type is kayayo
      if (user.userType === 'kayayo') {
        await storage.createKayayoAvailability({
          kayayoId: user.id,
          market: "Makola",
          isAvailable: true,
          currentLocation: "Market Entrance",
          maxOrders: 3,
          currentOrders: 0
        });
      }

      const jwtSecret = process.env.SESSION_SECRET;
      if (!jwtSecret) {
        console.error('SESSION_SECRET environment variable is required');
        return res.status(500).json({ message: "Server configuration error" });
      }

      const token = jwt.sign(
        { userId: user.id, userType: user.userType },
        jwtSecret,
        { expiresIn: '24h' }
      );

      res.json({ user: { ...user, password: undefined }, token });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, email, password } = req.body;

      console.log('Login attempt:', { phone, email, hasPassword: !!password });

      // Determine login method (phone or email)
      let user;
      if (email) {
        user = await storage.getUserByEmail(email);
      } else if (phone) {
        user = await storage.getUserByPhone(phone);
      } else {
        return res.status(400).json({ message: "Either phone or email is required" });
      }

      if (!user) {
        console.log('User not found');
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log('User found:', user.id, user.userType);

      // Compare provided password with hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log('Password invalid');
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update user online status
      await storage.updateUser(user.id, { isOnline: true });

      const jwtSecret = process.env.SESSION_SECRET;
      if (!jwtSecret) {
        console.error('SESSION_SECRET environment variable is required');
        return res.status(500).json({ message: "Server configuration error" });
      }

      const token = jwt.sign(
        { userId: user.id, userType: user.userType },
        jwtSecret,
        { expiresIn: '24h' }
      );

      res.json({ user: { ...user, password: undefined }, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  // User routes
  app.get("/api/users/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/users/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.id;

      // Ensure user can only update their own profile
      if (req.user!.userId !== userId && req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { name, phone, email } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.patch("/api/users/:id/online-status", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.id;

      // Ensure user can only update their own status
      if (req.user!.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { isOnline } = req.body;

      const updatedUser = await storage.updateUser(userId, { isOnline });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      console.error('Update online status error:', error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Seller routes
  app.get("/api/sellers", async (req, res) => {
    try {
      const { market, userId } = req.query;

      let sellers: any[] = [];

      if (userId) {
        const seller = await storage.getSellerByUserId(userId as string);
        if (seller) {
          sellers = [seller];
        }
      } else {
        const marketName = market as string || 'Makola';
        sellers = await storage.getSellersByMarket(marketName);
      }

      // Get seller user data for each seller
      const sellersWithUserData = await Promise.all(
        sellers.map(async (seller) => {
          const user = await storage.getUser(seller.userId);
          return { ...seller, user };
        })
      );

      res.json(sellersWithUserData);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/sellers/:id", async (req, res) => {
    try {
      const seller = await storage.getSeller(req.params.id);
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }

      const user = await storage.getUser(seller.userId);
      res.json({ ...seller, user });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/sellers/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const sellerId = req.params.id;
      
      // Get the seller to verify ownership
      const seller = await storage.getSeller(sellerId);
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }

      // Ensure user can only update their own seller profile
      if (req.user!.userId !== seller.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updatedSeller = await storage.updateSeller(sellerId, req.body);
      if (!updatedSeller) {
        return res.status(404).json({ message: "Seller not found" });
      }

      res.json(updatedSeller);
    } catch (error) {
      console.error('Update seller error:', error);
      res.status(500).json({ message: "Failed to update seller profile" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    const { sellerId, category, search } = req.query;

    let result;
    
    if (sellerId) {
      result = await storage.getProductsBySeller(sellerId as string);
    } else if (category) {
      result = await storage.getProductsByCategory(category as string);
    } else if (search) {
      result = await storage.searchProducts(search as string);
    } else {
      result = await storage.getAllProducts();
    }

    // Ensure images field is properly returned as an array
    const productsWithImages = result.map(product => ({
      ...product,
      images: product.images || []
    }));
    res.json(productsWithImages);
  });

  app.post("/api/products", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Product creation request:", JSON.stringify(req.body));
      const productData = insertProductSchema.parse(req.body);
      console.log("Parsed product data:", productData);
      
      if (productData.image && productData.image.startsWith('data:')) {
        console.log("Uploading main image to Cloudinary...");
        productData.image = await uploadImageToCloudinary(productData.image, 'makola-connect/products');
      }
      
      if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
        const base64Images = productData.images.filter((img: string) => img.startsWith('data:'));
        if (base64Images.length > 0) {
          console.log(`Uploading ${base64Images.length} additional images to Cloudinary...`);
          const cloudinaryUrls = await uploadMultipleImagesToCloudinary(base64Images, 'makola-connect/products');
          const nonBase64Images = productData.images.filter((img: string) => !img.startsWith('data:'));
          productData.images = [...cloudinaryUrls, ...nonBase64Images];
        }
      }
      
      const product = await storage.createProduct(productData);
      console.log("Product created successfully:", product.id);
      res.json(product);
    } catch (error) {
      console.error("Product creation error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(400).json({ 
        message: "Invalid product data",
        error: error instanceof Error ? error.message : "Unknown error",
        details: error
      });
    }
  });

  app.patch("/api/products/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const updateData = { ...req.body };
      
      if (updateData.image && updateData.image.startsWith('data:')) {
        console.log("Uploading main image to Cloudinary...");
        updateData.image = await uploadImageToCloudinary(updateData.image, 'makola-connect/products');
      }
      
      if (updateData.images && Array.isArray(updateData.images) && updateData.images.length > 0) {
        const base64Images = updateData.images.filter((img: string) => img.startsWith('data:'));
        if (base64Images.length > 0) {
          console.log(`Uploading ${base64Images.length} additional images to Cloudinary...`);
          const cloudinaryUrls = await uploadMultipleImagesToCloudinary(base64Images, 'makola-connect/products');
          const nonBase64Images = updateData.images.filter((img: string) => !img.startsWith('data:'));
          updateData.images = [...cloudinaryUrls, ...nonBase64Images];
        }
      }
      
      const product = await storage.updateProduct(req.params.id, updateData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Cart routes
  app.get("/api/cart", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const cartItems = await storage.getCartItems(req.user!.userId);

      // Get product details for each cart item
      const cartWithProducts = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return { ...item, product };
        })
      );

      res.json(cartWithProducts);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/cart", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        buyerId: req.user!.userId
      });

      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid cart data" });
    }
  });

  app.patch("/api/cart/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const cartItem = await storage.updateCartItem(req.params.id, req.body);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/cart/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.removeFromCart(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delivery Addresses routes
  app.get("/api/delivery-addresses", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const addresses = await storage.getDeliveryAddressesByUser(req.user!.userId);
      res.json(addresses);
    } catch (error) {
      console.error("Get delivery addresses error:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      res.status(500).json({ 
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/delivery-addresses", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const addressData = insertDeliveryAddressSchema.parse({
        ...req.body,
        userId: req.user!.userId
      });
      const address = await storage.createDeliveryAddress(addressData);
      res.json(address);
    } catch (error) {
      console.error("Delivery address creation error:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      res.status(400).json({ 
        message: "Invalid address data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.patch("/api/delivery-addresses/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const existingAddress = await storage.getDeliveryAddress(req.params.id);
      if (!existingAddress || existingAddress.userId !== req.user!.userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      const { userId, id, createdAt, ...allowedUpdates } = req.body;
      const address = await storage.updateDeliveryAddress(req.params.id, allowedUpdates);
      res.json(address);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/delivery-addresses/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const existingAddress = await storage.getDeliveryAddress(req.params.id);
      if (!existingAddress || existingAddress.userId !== req.user!.userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      const success = await storage.deleteDeliveryAddress(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/delivery-addresses/:id/set-default", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const existingAddress = await storage.getDeliveryAddress(req.params.id);
      if (!existingAddress || existingAddress.userId !== req.user!.userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      await storage.setDefaultAddress(req.user!.userId, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Order routes
  app.get("/api/orders", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userType = req.user!.userType;
      const userId = req.user!.userId;

      let orders: any[] = [];

      switch (userType) {
        case 'buyer':
          orders = await storage.getOrdersByBuyer(userId);
          break;
        case 'kayayo':
          orders = await storage.getOrdersByKayayo(userId);
          break;
        case 'rider':
          orders = await storage.getOrdersByRider(userId);
          break;
        case 'seller':
          const sellerProfile = await storage.getSellerByUserId(userId);
          if (sellerProfile) {
            orders = await storage.getOrdersBySeller(sellerProfile.id);
          } else {
            orders = [];
          }
          break;
        default:
          orders = [];
      }

      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/orders", authenticateToken, async (req: AuthenticatedRequest, res) => {
    console.log("Order creation started for user:", req.user!.userId);
    console.log("Request body:", JSON.stringify(req.body));
    try {
      // Get cart items to calculate total amount
      const cartItems = await storage.getCartItems(req.user!.userId);
      console.log("Cart items found:", cartItems.length);

      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate total amount from cart items
      let totalAmount = 0;
      for (const cartItem of cartItems) {
        const product = await storage.getProduct(cartItem.productId);
        if (product) {
          const itemTotal = parseFloat(product.price) * cartItem.quantity;
          console.log(`Product ${product.name}: ${product.price} x ${cartItem.quantity} = ${itemTotal}`);
          totalAmount += itemTotal;
        } else {
          console.log(`Product not found for ID: ${cartItem.productId}`);
        }
      }
      console.log(`Total amount calculated: ${totalAmount}`);

      // Ensure buyerId is set from authenticated user, not from request body
      const { buyerId, ...restOfBody } = req.body;
      const orderData = insertOrderSchema.parse({
        ...restOfBody,
        buyerId: req.user!.userId,
        totalAmount: totalAmount.toString()
      });

      const order = await storage.createOrder(orderData);

      // Create order items from cart
      for (const cartItem of cartItems) {
        const product = await storage.getProduct(cartItem.productId);
        if (product) {
          await storage.createOrderItem({
            orderId: order.id,
            productId: cartItem.productId,
            sellerId: product.sellerId,
            quantity: cartItem.quantity,
            unitPrice: product.price,
            subtotal: (parseFloat(product.price) * cartItem.quantity).toString(),
            notes: cartItem.notes,
            isConfirmed: false,
            isPicked: false,
            substitutedWith: null
          });
        }
      }

      // Clear cart after order creation
      await storage.clearCart(req.user!.userId);

      // Broadcast order update to relevant users
      broadcastToUser(order.buyerId, {
        type: 'ORDER_CREATED',
        order
      });

      res.json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(400).json({ 
        message: "Invalid order data", 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error
      });
    }
  });

  // Get pending orders (for sellers/kayayos/riders) - must be before :id route
  app.get("/api/orders/pending", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const orders = await storage.getPendingOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get single order by ID
  app.get("/api/orders/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const order = await storage.getOrder(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify user has access to this order
      const userType = req.user!.userType;
      const userId = req.user!.userId;

      let hasAccess = false;

      if (userType === 'buyer' && order.buyerId === userId) {
        hasAccess = true;
      } else if (userType === 'kayayo' && order.kayayoId === userId) {
        hasAccess = true;
      } else if (userType === 'rider' && order.riderId === userId) {
        hasAccess = true;
      } else if (userType === 'seller') {
        // Sellers can only see orders that contain their products
        const sellerProfile = await storage.getSellerByUserId(userId);
        if (sellerProfile) {
          const orderItems = await storage.getOrderItemsByOrder(req.params.id);
          hasAccess = orderItems.some(item => item.sellerId === sellerProfile.id);
        }
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "You don't have access to this order" });
      }

      // Get additional details
      const buyer = await storage.getUser(order.buyerId);
      const kayayo = order.kayayoId ? await storage.getUser(order.kayayoId) : null;
      const rider = order.riderId ? await storage.getUser(order.riderId) : null;

      res.json({
        ...order,
        buyer,
        kayayo,
        rider
      });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/orders/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only buyers can use the generic PATCH endpoint
      if (req.user!.userType !== 'buyer') {
        return res.status(403).json({ 
          message: "Only buyers can use this endpoint. Sellers, kayayos, and riders must use role-specific endpoints for workflow actions." 
        });
      }

      // Get the existing order first to verify ownership
      const existingOrder = await storage.getOrder(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify buyer owns this order
      if (existingOrder.buyerId !== req.user!.userId) {
        return res.status(403).json({ message: "You can only update your own orders" });
      }

      // Define allowed updates for buyers
      const allowedFields = ['deliveryAddress', 'deliveryInstructions'];
      const requestedFields = Object.keys(req.body);

      // Check if buyer is requesting unauthorized updates
      const unauthorizedFields = requestedFields.filter(field => !allowedFields.includes(field));
      if (unauthorizedFields.length > 0) {
        return res.status(403).json({ 
          message: `Unauthorized field updates: ${unauthorizedFields.join(', ')}. Buyers can only update deliveryAddress and deliveryInstructions.` 
        });
      }

      // Prevent empty patch requests
      if (requestedFields.length === 0) {
        return res.status(400).json({ message: "No fields provided for update" });
      }

      // Filter request body to only include allowed fields
      const filteredUpdates = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
      );

      const order = await storage.updateOrder(req.params.id, filteredUpdates);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Broadcast order update
      broadcastToUser(order.buyerId, {
        type: 'ORDER_UPDATED',
        order
      });

      if (order.kayayoId) {
        broadcastToUser(order.kayayoId, {
          type: 'ORDER_UPDATED',
          order
        });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Kayayo accepts an order
  app.patch("/api/orders/:id/accept", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only kayayos can accept orders
      if (req.user!.userType !== 'kayayo') {
        return res.status(403).json({ message: "Only kayayos can accept orders" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update order with kayayo info and status
      const updatedOrder = await storage.updateOrder(req.params.id, {
        kayayoId: req.user!.userId,
        status: "kayayo_accepted"
      });

      if (!updatedOrder) {
        return res.status(404).json({ message: "Failed to update order" });
      }

      // Broadcast to buyer
      broadcastToUser(updatedOrder.buyerId, {
        type: 'ORDER_UPDATED',
        order: updatedOrder
      });

      // Broadcast to kayayo
      broadcastToUser(req.user!.userId, {
        type: 'ORDER_ACCEPTED',
        order: updatedOrder
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error("Accept order error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get order items for a specific order
  app.get("/api/orders/:orderId/items", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const orderItems = await storage.getOrderItemsByOrder(req.params.orderId);

      // Get product details for each order item
      const orderItemsWithProducts = await Promise.all(
        orderItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return { ...item, product };
        })
      );

      res.json(orderItemsWithProducts);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Seller confirms/accepts order items
  app.patch("/api/orders/:orderId/items/:itemId/confirm", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only sellers can confirm order items
      if (req.user!.userType !== 'seller') {
        return res.status(403).json({ message: "Only sellers can confirm order items" });
      }

      // Get the order item to verify seller ownership
      const orderItem = await storage.getOrderItem(req.params.itemId);
      if (!orderItem) {
        return res.status(404).json({ message: "Order item not found" });
      }

      // Get seller profile to verify this seller owns this order item
      const sellerProfile = await storage.getSellerByUserId(req.user!.userId);
      if (!sellerProfile || orderItem.sellerId !== sellerProfile.id) {
        return res.status(403).json({ message: "You can only confirm your own order items" });
      }

      const updatedOrderItem = await storage.updateOrderItem(req.params.itemId, {
        isConfirmed: true
      });

      if (!updatedOrderItem) {
        return res.status(404).json({ message: "Order item not found" });
      }

      // Check if all items in the order are confirmed
      const allOrderItems = await storage.getOrderItemsByOrder(req.params.orderId);
      const allConfirmed = allOrderItems.every(item => item.isConfirmed || item.id === updatedOrderItem.id);

      if (allConfirmed) {
        // Get the current order to validate transition
        const currentOrder = await storage.getOrder(req.params.orderId);
        if (!currentOrder) {
          return res.status(404).json({ message: "Order not found" });
        }

        try {
          // Validate state transition using state machine
          OrderStateMachine.validateTransition(
            currentOrder,
            OrderStatus.SELLER_CONFIRMED,
            'seller',
            req.user!.userId
          );

          // Update order status to seller_confirmed
          const order = await storage.updateOrder(req.params.orderId, {
            status: OrderStatus.SELLER_CONFIRMED,
            confirmedAt: new Date()
          });

          if (order) {
            broadcastToUser(order.buyerId, {
              type: 'ORDER_SELLER_CONFIRMED',
              order
            });
          }
        } catch (error) {
          if (error instanceof OrderStateError) {
            return res.status(400).json({ 
              message: error.message,
              code: error.code 
            });
          }
          throw error;
        }
      }

      res.json(updatedOrderItem);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get available orders for kayayos (orders that need shopping)
  app.get("/api/orders/available-for-kayayo", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only kayayos can view available orders
      if (req.user!.userType !== 'kayayo') {
        return res.status(403).json({ message: "Only kayayos can view available orders" });
      }

      // Get orders that are seller_confirmed but don't have kayayo assigned yet
      const orders = Array.from((storage as any).orders.values()).filter((order: any) => 
        order.status === OrderStatus.SELLER_CONFIRMED && !order.kayayoId
      );

      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Seller confirms/accepts or declines an order
  app.patch("/api/orders/:id/seller-confirm", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only sellers can confirm orders
      if (req.user!.userType !== 'seller') {
        return res.status(403).json({ message: "Only sellers can confirm orders" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get seller profile to verify this seller has items in this order
      const sellerProfile = await storage.getSellerByUserId(req.user!.userId);
      if (!sellerProfile) {
        return res.status(404).json({ message: "Seller profile not found" });
      }

      const orderItems = await storage.getOrderItemsByOrder(req.params.id);
      const hasSellerItems = orderItems.some(item => item.sellerId === sellerProfile.id);
      
      if (!hasSellerItems) {
        return res.status(403).json({ message: "You don't have items in this order" });
      }

      // Check if declining or accepting
      const newStatus = req.body.status === "cancelled" ? "cancelled" : "seller_confirmed";

      const updatedOrder = await storage.updateOrder(req.params.id, {
        status: newStatus
      });

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Broadcast to buyer
      const eventType = newStatus === "cancelled" ? 'ORDER_CANCELLED' : 'ORDER_ACCEPTED';
      broadcastToUser(updatedOrder.buyerId, {
        type: eventType,
        order: updatedOrder
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error("Seller confirm order error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get available deliveries for riders (orders ready for pickup)
  app.get("/api/orders/available-for-rider", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only riders can view available deliveries
      if (req.user!.userType !== 'rider') {
        return res.status(403).json({ message: "Only riders can view available deliveries" });
      }

      // Get orders that are ready for pickup but don't have rider assigned yet
      const orders = Array.from((storage as any).orders.values()).filter((order: any) => 
        order.status === OrderStatus.READY_FOR_PICKUP && !order.riderId
      );

      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Kayayo accepts order
  app.patch("/api/orders/:orderId/accept", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only kayayos can accept orders
      if (req.user!.userType !== 'kayayo') {
        return res.status(403).json({ message: "Only kayayos can accept orders" });
      }

      // Get the order to validate state and ownership
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      try {
        // Validate state transition
        OrderStateMachine.validateTransition(
          order,
          OrderStatus.KAYAYO_ACCEPTED,
          'kayayo',
          req.user!.userId
        );

        // Update order status and assign kayayo
        const updatedOrder = await storage.updateOrder(req.params.orderId, {
          status: OrderStatus.KAYAYO_ACCEPTED,
          kayayoId: req.user!.userId
        });

        if (!updatedOrder) {
          return res.status(404).json({ message: "Order not found" });
        }

        // Broadcast to buyer
        broadcastToUser(updatedOrder.buyerId, {
          type: 'ORDER_KAYAYO_ACCEPTED',
          order: updatedOrder
        });

        res.json(updatedOrder);
      } catch (error) {
        if (error instanceof OrderStateError) {
          return res.status(400).json({ 
            message: error.message,
            code: error.code 
          });
        }
        throw error;
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Kayayo starts shopping
  app.patch("/api/orders/:orderId/start-shopping", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only kayayos can start shopping
      if (req.user!.userType !== 'kayayo') {
        return res.status(403).json({ message: "Only kayayos can start shopping" });
      }

      // Get the order to validate state and ownership
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      try {
        // Validate state transition
        OrderStateMachine.validateTransition(
          order,
          OrderStatus.SHOPPING,
          'kayayo',
          req.user!.userId
        );

        // Update order status
        const updatedOrder = await storage.updateOrder(req.params.orderId, {
          status: OrderStatus.SHOPPING
        });

        if (!updatedOrder) {
          return res.status(404).json({ message: "Order not found" });
        }

        // Broadcast to buyer
        broadcastToUser(updatedOrder.buyerId, {
          type: 'ORDER_SHOPPING_STARTED',
          order: updatedOrder
        });

        res.json(updatedOrder);
      } catch (error) {
        if (error instanceof OrderStateError) {
          return res.status(400).json({ 
            message: error.message,
            code: error.code 
          });
        }
        throw error;
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Rider picks up order for delivery
  app.patch("/api/orders/:orderId/pickup", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only riders can pick up orders
      if (req.user!.userType !== 'rider') {
        return res.status(403).json({ message: "Only riders can pick up orders" });
      }

      // Get the order to verify it's ready for pickup
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      try {
        // Validate state transition using state machine
        OrderStateMachine.validateTransition(
          order,
          OrderStatus.IN_TRANSIT,
          'rider',
          req.user!.userId
        );

        // Additional check for rider assignment
        if (order.riderId && order.riderId !== req.user!.userId) {
          return res.status(403).json({ message: "Order is already assigned to another rider" });
        }
      } catch (error) {
        if (error instanceof OrderStateError) {
          return res.status(400).json({ 
            message: error.message,
            code: error.code 
          });
        }
        throw error;
      }

      const updatedOrder = await storage.updateOrder(req.params.orderId, {
        status: OrderStatus.IN_TRANSIT,
        riderId: req.user!.userId
      });

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Broadcast to buyer and kayayo
      broadcastToUser(updatedOrder.buyerId, {
        type: 'ORDER_IN_TRANSIT',
        order: updatedOrder
      });

      if (updatedOrder.kayayoId) {
        broadcastToUser(updatedOrder.kayayoId, {
          type: 'ORDER_IN_TRANSIT',
          order: updatedOrder
        });
      }

      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Rider completes delivery
  app.patch("/api/orders/:orderId/deliver", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only riders can complete deliveries
      if (req.user!.userType !== 'rider') {
        return res.status(403).json({ message: "Only riders can complete deliveries" });
      }

      // Get the order to verify rider ownership
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      try {
        // Validate state transition using state machine
        OrderStateMachine.validateTransition(
          order,
          OrderStatus.DELIVERED,
          'rider',
          req.user!.userId
        );
      } catch (error) {
        if (error instanceof OrderStateError) {
          return res.status(400).json({ 
            message: error.message,
            code: error.code 
          });
        }
        throw error;
      }

      const updatedOrder = await storage.updateOrder(req.params.orderId, {
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date()
      });

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Broadcast to buyer and kayayo
      broadcastToUser(updatedOrder.buyerId, {
        type: 'ORDER_DELIVERED',
        order: updatedOrder
      });

      if (updatedOrder.kayayoId) {
        broadcastToUser(updatedOrder.kayayoId, {
          type: 'ORDER_DELIVERED',
          order: updatedOrder
        });
      }

      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Kayayo marks shopping as complete and ready for rider pickup
  app.patch("/api/orders/:orderId/ready-for-pickup", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only kayayos can mark orders as ready for pickup
      if (req.user!.userType !== 'kayayo') {
        return res.status(403).json({ message: "Only kayayos can mark orders as ready for pickup" });
      }

      // Get the order to verify kayayo ownership
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      try {
        // Validate state transition using state machine
        OrderStateMachine.validateTransition(
          order,
          OrderStatus.READY_FOR_PICKUP,
          'kayayo',
          req.user!.userId
        );
      } catch (error) {
        if (error instanceof OrderStateError) {
          return res.status(400).json({ 
            message: error.message,
            code: error.code 
          });
        }
        throw error;
      }

      const updatedOrder = await storage.updateOrder(req.params.orderId, {
        status: OrderStatus.READY_FOR_PICKUP
      });

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Mark all order items as picked
      const orderItems = await storage.getOrderItemsByOrder(req.params.orderId);
      await Promise.all(orderItems.map(item => 
        storage.updateOrderItem(item.id, { isPicked: true })
      ));

      // Broadcast to buyer and available riders
      broadcastToUser(updatedOrder.buyerId, {
        type: 'ORDER_READY_FOR_PICKUP',
        order: updatedOrder
      });

      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get available actions for an order
  app.get("/api/orders/:orderId/actions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const actions = OrderStateMachine.getAvailableActions(
        order,
        req.user!.userType,
        req.user!.userId
      );

      res.json({
        orderId: order.id,
        currentStatus: order.status,
        statusDisplayName: OrderStateMachine.getStatusDisplayName(order.status),
        statusDescription: OrderStateMachine.getStatusDescription(order.status),
        isTerminal: OrderStateMachine.isTerminalStatus(order.status),
        availableActions: actions
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Kayayo routes
  app.get("/api/kayayos/available", async (req, res) => {
    try {
      const market = req.query.market as string || 'Makola';
      
      // Get all kayayos for the market
      const allKayayos = await storage.getAvailableKayayos(market);

      // Get user data for each kayayo
      const kayayosWithUserData = await Promise.all(
        allKayayos.map(async (availability) => {
          const user = await storage.getUser(availability.kayayoId);
          return { ...availability, user };
        })
      );

      res.json(kayayosWithUserData);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/kayayos/:id/availability", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const availability = await storage.updateKayayoAvailability(req.params.id, req.body);
      if (!availability) {
        return res.status(404).json({ message: "Kayayo not found" });
      }
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Reviews routes
  app.get("/api/reviews/:userId", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByReviewee(req.params.userId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/reviews", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const reviewData = {
        ...req.body,
        reviewerId: req.user!.userId
      };

      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  // Admin routes
  // Get all users
  app.get("/api/admin/users", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Verify admin user
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const buyers = await storage.getUsersByType('buyer');
      const sellers = await storage.getUsersByType('seller');
      const kayayos = await storage.getUsersByType('kayayo');
      const riders = await storage.getUsersByType('rider');
      const admins = await storage.getUsersByType('admin');

      // Filter out inactive (soft-deleted) users
      const allUsers = [...buyers, ...sellers, ...kayayos, ...riders, ...admins]
        .filter(user => user.isActive !== false);

      res.json(allUsers);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Verify a user
  app.patch("/api/admin/users/:id/verify", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Verify admin user
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const user = await storage.updateUser(req.params.id, { isVerified: true });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User verified successfully", user });
    } catch (error) {
      console.error('Verify user error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Suspend/unsuspend a user
  app.patch("/api/admin/users/:id/suspend", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Verify admin user
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const { suspend } = req.body;

      // Suspend means setting isSuspended flag, verification status stays intact
      const user = await storage.updateUser(req.params.id, { isSuspended: suspend });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: suspend ? "User suspended successfully" : "User unsuspended successfully",
        user 
      });
    } catch (error) {
      console.error('Suspend user error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete a user
  app.delete("/api/admin/users/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Verify admin user
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      // Prevent deleting admin users
      const userToDelete = await storage.getUser(req.params.id);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }

      if (userToDelete.userType === 'admin') {
        return res.status(403).json({ message: "Cannot delete admin users" });
      }

      // Soft delete by setting isActive to false
      await storage.updateUser(req.params.id, { isActive: false, isOnline: false });

      res.json({ message: "User removed successfully" });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/stats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Verify admin user
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      // Get user counts by type
      const buyers = await storage.getUsersByType('buyer');
      const sellers = await storage.getUsersByType('seller');
      const kayayos = await storage.getUsersByType('kayayo');
      const riders = await storage.getUsersByType('rider');

      // Get all orders
      const allOrders = await storage.getAllOrders();

      // Calculate order stats
      const pendingOrders = allOrders.filter(o => o.status === 'pending');
      const activeOrders = allOrders.filter(o => 
        ['seller_confirmed', 'kayayo_accepted', 'shopping', 'ready_for_pickup', 'in_transit'].includes(o.status)
      );
      const completedOrders = allOrders.filter(o => o.status === 'delivered');

      // Calculate revenue from platform fees
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisWeekStart = new Date();
      thisWeekStart.setDate(today.getDate() - 7);
      thisWeekStart.setHours(0, 0, 0, 0);

      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);

      const todayRevenue = completedOrders
        .filter(o => o.deliveredAt && new Date(o.deliveredAt) >= today)
        .reduce((sum, o) => sum + parseFloat(o.platformFee || "0"), 0);

      const weekRevenue = completedOrders
        .filter(o => o.deliveredAt && new Date(o.deliveredAt) >= thisWeekStart)
        .reduce((sum, o) => sum + parseFloat(o.platformFee || "0"), 0);

      const monthRevenue = completedOrders
        .filter(o => o.deliveredAt && new Date(o.deliveredAt) >= thisMonthStart)
        .reduce((sum, o) => sum + parseFloat(o.platformFee || "0"), 0);

      // Get issues - unverified users and pending disputes
      const unverifiedUsers = buyers.concat(sellers, kayayos, riders)
        .filter(u => u.isVerified === false).length;

      const allDisputes = await storage.getAllDisputes();
      const pendingDisputes = allDisputes.filter(d => d.status === 'pending' || d.status === 'under_review');

      const stats = {
        users: {
          buyers: buyers.length,
          sellers: sellers.length,
          kayayos: kayayos.length,
          riders: riders.length,
          total: buyers.length + sellers.length + kayayos.length + riders.length
        },
        orders: {
          pending: pendingOrders.length,
          active: activeOrders.length,
          completed: completedOrders.length,
          total: allOrders.length
        },
        revenue: {
          today: todayRevenue,
          thisWeek: weekRevenue,
          thisMonth: monthRevenue
        },
        issues: {
          disputes: pendingDisputes.length,
          suspendedUsers: unverifiedUsers,
          flaggedOrders: 0
        }
      };

      res.json(stats);
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin Orders Routes
  app.get("/api/admin/orders", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const allOrders = await storage.getAllOrders();

      // Enrich orders with user details
      const ordersWithDetails = await Promise.all(allOrders.map(async (order) => {
        const buyer = await storage.getUser(order.buyerId);
        const kayayo = order.kayayoId ? await storage.getUser(order.kayayoId) : null;
        const rider = order.riderId ? await storage.getUser(order.riderId) : null;
        const orderItems = await storage.getOrderItemsByOrder(order.id);

        // Check if order is delayed (more than 2 hours since creation)
        const createdTime = new Date(order.createdAt!).getTime();
        const now = new Date().getTime();
        const hoursSinceCreation = (now - createdTime) / (1000 * 60 * 60);
        const isDelayed = hoursSinceCreation > 2 && !['delivered', 'cancelled'].includes(order.status);

        return {
          ...order,
          buyerName: buyer?.name,
          kayayoName: kayayo?.name,
          riderName: rider?.name,
          itemCount: orderItems.length,
          isDelayed
        };
      }));

      res.json(ordersWithDetails);
    } catch (error) {
      console.error('Admin orders error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/orders/:id/reassign", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const { type } = req.body; // "kayayo" or "rider"
      const order = await storage.getOrder(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Clear the assignment
      if (type === "kayayo") {
        await storage.updateOrder(req.params.id, { kayayoId: null });
      } else if (type === "rider") {
        await storage.updateOrder(req.params.id, { riderId: null });
      }

      res.json({ message: "Order reassigned successfully" });
    } catch (error) {
      console.error('Reassign order error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin Payments Routes
  app.get("/api/admin/payments/stats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const allOrders = await storage.getAllOrders();

      // Calculate payment stats
      const held = allOrders
        .filter(o => ['pending', 'seller_confirmed', 'kayayo_accepted', 'shopping', 'ready_for_pickup', 'in_transit'].includes(o.status))
        .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

      const released = allOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

      const pending = allOrders
        .filter(o => o.status === 'pending')
        .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

      const totalRevenue = allOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.platformFee || "0"), 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisWeekStart = new Date();
      thisWeekStart.setDate(today.getDate() - 7);

      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);

      const todayRevenue = allOrders
        .filter(o => o.status === 'delivered' && o.deliveredAt && new Date(o.deliveredAt) >= today)
        .reduce((sum, o) => sum + parseFloat(o.platformFee || "0"), 0);

      const weekRevenue = allOrders
        .filter(o => o.status === 'delivered' && o.deliveredAt && new Date(o.deliveredAt) >= thisWeekStart)
        .reduce((sum, o) => sum + parseFloat(o.platformFee || "0"), 0);

      const monthRevenue = allOrders
        .filter(o => o.status === 'delivered' && o.deliveredAt && new Date(o.deliveredAt) >= thisMonthStart)
        .reduce((sum, o) => sum + parseFloat(o.platformFee || "0"), 0);

      res.json({
        held,
        released,
        pending,
        totalRevenue,
        todayRevenue,
        weekRevenue,
        monthRevenue
      });
    } catch (error) {
      console.error('Payment stats error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/payments/transactions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const allOrders = await storage.getAllOrders();

      const transactions = await Promise.all(allOrders.map(async (order) => {
        const buyer = await storage.getUser(order.buyerId);

        let status: "held" | "released" | "pending" | "frozen" = "pending";
        if (order.status === 'delivered') {
          status = "released";
        } else if (['seller_confirmed', 'kayayo_accepted', 'shopping', 'ready_for_pickup', 'in_transit'].includes(order.status)) {
          status = "held";
        }

        return {
          id: order.id,
          orderId: order.id,
          buyerName: buyer?.name || "Unknown",
          amount: parseFloat(order.totalAmount),
          platformFee: parseFloat(order.platformFee || "0"),
          status,
          paymentMethod: order.paymentMethod || "cash",
          createdAt: order.createdAt!,
          releasedAt: order.deliveredAt || undefined
        };
      }));

      res.json(transactions);
    } catch (error) {
      console.error('Transactions error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/payments/:orderId/freeze", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const { freeze } = req.body;
      // In a real app, you'd have a frozen status field on the order
      // For now, we'll just return success
      res.json({ message: freeze ? "Payment frozen" : "Payment unfrozen" });
    } catch (error) {
      console.error('Freeze payment error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/payments/export", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const period = req.query.period as string;
      const allOrders = await storage.getAllOrders();

      let filteredOrders = allOrders;
      if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredOrders = allOrders.filter(o => o.createdAt && new Date(o.createdAt) >= weekAgo);
      } else if (period === 'month') {
        const monthStart = new Date();
        monthStart.setDate(1);
        filteredOrders = allOrders.filter(o => o.createdAt && new Date(o.createdAt) >= monthStart);
      }

      // Generate CSV
      const csv = [
        "Order ID,Date,Amount,Platform Fee,Status",
        ...filteredOrders.map(o => 
          `${o.id},${o.createdAt},${o.totalAmount},${o.platformFee},${o.status}`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payments-${period}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin Disputes Routes
  app.get("/api/admin/disputes", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const allDisputes = await storage.getAllDisputes();

      const disputesWithDetails = await Promise.all(allDisputes.map(async (dispute) => {
        const reporter = await storage.getUser(dispute.reportedBy);
        const reportedAgainst = dispute.reportedAgainst ? await storage.getUser(dispute.reportedAgainst) : null;
        const order = await storage.getOrder(dispute.orderId);

        return {
          ...dispute,
          reporterName: reporter?.name,
          reportedAgainstName: reportedAgainst?.name,
          orderTotal: order ? parseFloat(order.totalAmount) : 0
        };
      }));

      res.json(disputesWithDetails);
    } catch (error) {
      console.error('Disputes error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/disputes/:id/resolve", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const { status, resolution, refundAmount, penaltyAmount } = req.body;

      await storage.updateDispute(req.params.id, {
        status,
        resolution,
        refundAmount: refundAmount ? refundAmount.toString() : null,
        penaltyAmount: penaltyAmount ? penaltyAmount.toString() : null,
        resolvedBy: req.user!.userId,
        resolvedAt: new Date()
      });

      res.json({ message: "Dispute resolved successfully" });
    } catch (error) {
      console.error('Resolve dispute error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Kayayo workflow routes
  app.patch("/api/orders/:id/start-shopping", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.userType !== 'kayayo') {
        return res.status(403).json({ message: "Only kayayos can start shopping" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.kayayoId !== req.user!.userId) {
        return res.status(403).json({ message: "You can only update your own orders" });
      }

      const updatedOrder = await storage.updateOrder(req.params.id, {
        status: "shopping"
      });

      broadcastToUser(order.buyerId, {
        type: 'ORDER_UPDATED',
        order: updatedOrder
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error('Start shopping error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/order-items/:id/pick", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.userType !== 'kayayo') {
        return res.status(403).json({ message: "Only kayayos can update items" });
      }

      const { isPicked } = req.body;
      const updatedItem = await storage.updateOrderItem(req.params.id, {
        isPicked
      });

      if (!updatedItem) {
        return res.status(404).json({ message: "Order item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error('Pick item error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/orders/:id/verify-seller", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.userType !== 'kayayo') {
        return res.status(403).json({ message: "Only kayayos can verify sellers" });
      }

      const { verificationCode } = req.body;
      
      // In a real app, you would verify the code against the seller's generated code
      // For now, we'll accept any 4-digit code
      if (!verificationCode || verificationCode.length !== 4) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ message: "Seller verified successfully", verified: true });
    } catch (error) {
      console.error('Verify seller error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/orders/:id/mark-ready", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.userType !== 'kayayo') {
        return res.status(403).json({ message: "Only kayayos can mark orders as ready" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.kayayoId !== req.user!.userId) {
        return res.status(403).json({ message: "You can only update your own orders" });
      }

      // Check if all items are picked
      const orderItems = await storage.getOrderItemsByOrder(req.params.id);
      const allPicked = orderItems.every(item => item.isPicked);

      if (!allPicked) {
        return res.status(400).json({ message: "All items must be picked before marking ready" });
      }

      const updatedOrder = await storage.updateOrder(req.params.id, {
        status: "ready_for_pickup"
      });

      broadcastToUser(order.buyerId, {
        type: 'ORDER_UPDATED',
        order: updatedOrder
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error('Mark ready error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/orders/:id/handover-to-rider", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.userType !== 'kayayo') {
        return res.status(403).json({ message: "Only kayayos can handover to riders" });
      }

      const { riderId, verificationCode } = req.body;

      if (!verificationCode || verificationCode.length !== 4) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.kayayoId !== req.user!.userId) {
        return res.status(403).json({ message: "You can only handover your own orders" });
      }

      // Generate expected verification code from order ID (same logic as frontend)
      const expectedCode = order.id.slice(0, 4).split('').map((char: string) => {
        const code = char.charCodeAt(0);
        return (code % 10).toString();
      }).join('');

      if (verificationCode !== expectedCode) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      const updatedOrder = await storage.updateOrder(req.params.id, {
        status: "in_transit",
        riderId: riderId || order.riderId
      });

      broadcastToUser(order.buyerId, {
        type: 'ORDER_UPDATED',
        order: updatedOrder
      });

      if (updatedOrder?.riderId) {
        broadcastToUser(updatedOrder.riderId, {
          type: 'ORDER_ASSIGNED',
          order: updatedOrder
        });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error('Handover to rider error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}