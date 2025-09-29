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
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        buyerId: req.user!.userId
      });
      
      const order = await storage.createOrder(orderData);
      
      // Create order items from cart
      const cartItems = await storage.getCartItems(req.user!.userId);
      
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
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.patch("/api/orders/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
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
