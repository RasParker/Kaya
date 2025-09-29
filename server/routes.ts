import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertProductSchema, insertCartItemSchema, insertOrderSchema } from "@shared/schema";
import jwt from "jsonwebtoken";

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

  jwt.verify(token, process.env.SESSION_SECRET || 'fallback-secret', (err: any, user: any) => {
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
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(userData.phone);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      
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

      const token = jwt.sign(
        { userId: user.id, userType: user.userType },
        process.env.SESSION_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({ user: { ...user, password: undefined }, token });
    } catch (error) {
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, password } = req.body;
      
      const user = await storage.getUserByPhone(phone);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update user online status
      await storage.updateUser(user.id, { isOnline: true });

      const token = jwt.sign(
        { userId: user.id, userType: user.userType },
        process.env.SESSION_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({ user: { ...user, password: undefined }, token });
    } catch (error) {
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

  // Seller routes
  app.get("/api/sellers", async (req, res) => {
    try {
      const market = req.query.market as string || 'Makola';
      const sellers = await storage.getSellersByMarket(market);
      
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

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category, sellerId, search } = req.query;
      
      let products = [];
      
      if (search) {
        products = await storage.searchProducts(search as string);
      } else if (category) {
        products = await storage.getProductsByCategory(category as string);
      } else if (sellerId) {
        products = await storage.getProductsBySeller(sellerId as string);
      } else {
        // Get all products (you might want to implement pagination)
        products = Array.from((storage as any).products.values());
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/products", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.patch("/api/products/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
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
          orders = await storage.getOrdersBySeller(userId);
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
      
      const orderData = insertOrderSchema.parse({
        ...req.body,
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

  // Get pending orders (for sellers/kayayos/riders)
  app.get("/api/orders/pending", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const orders = await storage.getPendingOrders();
      res.json(orders);
    } catch (error) {
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
        // Update order status to accepted
        const order = await storage.updateOrder(req.params.orderId, {
          status: "accepted",
          confirmedAt: new Date()
        });
        
        if (order) {
          broadcastToUser(order.buyerId, {
            type: 'ORDER_ACCEPTED',
            order
          });
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

      // Get orders that are accepted but don't have kayayo assigned yet
      const orders = Array.from((storage as any).orders.values()).filter((order: any) => 
        order.status === 'accepted' && !order.kayayoId
      );
      
      res.json(orders);
    } catch (error) {
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
        order.status === 'ready_for_pickup' && !order.riderId
      );
      
      res.json(orders);
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

      // Only the assigned kayayo can mark the order as ready
      if (order.kayayoId !== req.user!.userId) {
        return res.status(403).json({ message: "You can only complete orders assigned to you" });
      }

      const updatedOrder = await storage.updateOrder(req.params.orderId, {
        status: "ready_for_pickup"
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

  // Kayayo routes
  app.get("/api/kayayos/available", async (req, res) => {
    try {
      const market = req.query.market as string || 'Makola';
      const availableKayayos = await storage.getAvailableKayayos(market);
      
      // Get user data for each kayayo
      const kayayosWithUserData = await Promise.all(
        availableKayayos.map(async (availability) => {
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

  return httpServer;
}
