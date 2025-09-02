import express from 'express';
import { registerUser, loginUser, authenticateToken, AuthRequest } from './auth';
import { SensayService } from './sensay-service';
import ShopifyService from './shopify-service';
import CartService from './cart-service';
import { prisma } from './database';

const router = express.Router();
const sensayService = new SensayService();
const shopifyService = new ShopifyService();
const cartService = new CartService();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Shoppy Sensay API'
  });
});

// Auth routes
router.post('/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await registerUser(email, username, password);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      error: error.message || 'Registration failed'
    });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    const result = await loginUser(emailOrUsername, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ 
      error: error.message || 'Login failed'
    });
  }
});

// Protected routes (require authentication)
router.get('/auth/me', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// Chat routes
router.post('/chat/send', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { message, isNewChat, sessionId, userProducts } = req.body;
    const userId = req.user!.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`Chat request from user ${userId}:`, message, { isNewChat, sessionId, userProducts });
    const response = await sensayService.sendChatMessage(userId, message.trim(), isNewChat, sessionId, userProducts);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: error.message || 'Chat failed'
    });
  }
});

router.get('/chat/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const sessionId = req.query.sessionId as string;

    const history = await sensayService.getChatHistory(userId, sessionId);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Chat history error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get chat history'
    });
  }
});

router.get('/chat/sensay-history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const history = await sensayService.getSensayChatHistory(userId);
    
    res.json({
      success: true,
      type: 'chat_history',
      items: history
    });
  } catch (error: any) {
    console.error('Sensay chat history error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get Sensay chat history'
    });
  }
});

router.get('/chat/sessions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const sessions = await sensayService.getChatSessions(userId);
    
    res.json({
      success: true,
      data: sessions
    });
  } catch (error: any) {
    console.error('Chat sessions error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get chat sessions'
    });
  }
});

// Analytics routes - DISABLED due to Sensay API limitations
// router.get('/analytics', authenticateToken, async (req: AuthRequest, res) => {
//   try {
//     const userId = req.user!.id;
//     const analytics = await sensayService.getUserAnalytics(userId);
//     res.json({
//       success: true,
//       data: analytics
//     });
//   } catch (error: any) {
//     console.error('Analytics error:', error);
//     res.status(500).json({ 
//       error: error.message || 'Failed to get analytics'
//     });
//   }
// });

// Admin routes (for debugging)
router.get('/admin/users', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Simple admin check - you can enhance this
    if (!req.user!.email.includes('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        sensayUserId: true,
        createdAt: true,
        _count: {
          select: {
            chatSessions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    console.error('Admin users error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get users'
    });
  }
});

router.get('/admin/api-usage', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user!.email.includes('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const usage = await prisma.apiUsage.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    
    res.json({
      success: true,
      data: usage
    });
  } catch (error: any) {
    console.error('Admin API usage error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get API usage'
    });
  }
});

// Shopify API routes
router.post('/shopify/search', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { query, limit = 5 } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`Shopify search request: "${query}" (limit: ${limit})`);
    const products = await shopifyService.searchProducts(query.trim(), limit);
    
    res.json({
      success: true,
      data: {
        products,
        count: products.length,
        formattedResponse: shopifyService.formatProductsForChat(products)
      }
    });
  } catch (error: any) {
    console.error('Shopify search error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to search products'
    });
  }
});

router.get('/shopify/product/:handle', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { handle } = req.params;
    
    if (!handle) {
      return res.status(400).json({ error: 'Product handle is required' });
    }

    console.log(`Getting product details for handle: ${handle}`);
    const product = await shopifyService.getProductByHandle(handle);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error: any) {
    console.error('Shopify get product error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get product details'
    });
  }
});

router.post('/shopify/cart/create', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log(`Creating cart for user ${req.user!.id}`);
    const cart = await shopifyService.createCart();
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error: any) {
    console.error('Shopify create cart error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create cart'
    });
  }
});

router.post('/shopify/cart/add', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { cartId, variantId, quantity = 1 } = req.body;
    
    if (!cartId || !variantId) {
      return res.status(400).json({ error: 'Cart ID and variant ID are required' });
    }

    console.log(`Adding variant ${variantId} to cart ${cartId} (qty: ${quantity})`);
    const cart = await shopifyService.addToCart(cartId, variantId, quantity);
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error: any) {
    console.error('Shopify add to cart error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to add item to cart'
    });
  }
});

router.get('/shopify/cart/:cartId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { cartId } = req.params;
    
    if (!cartId) {
      return res.status(400).json({ error: 'Cart ID is required' });
    }

    console.log(`Getting cart details for: ${cartId}`);
    const cart = await shopifyService.getCart(cartId);
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error: any) {
    console.error('Shopify get cart error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get cart details'
    });
  }
});

router.get('/shopify/order/:orderName', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { orderName } = req.params;
    
    if (!orderName) {
      return res.status(400).json({ error: 'Order name/number is required' });
    }

    console.log(`Checking order status for: ${orderName}`);
    const order = await shopifyService.getOrderStatus(orderName);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    console.error('Shopify get order error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get order status'
    });
  }
});

router.get('/shopify/featured', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    console.log(`Getting featured products (limit: ${limit})`);
    const products = await shopifyService.getFeaturedProducts(limit);
    
    res.json({
      success: true,
      data: {
        products,
        count: products.length,
        formattedResponse: shopifyService.formatProductsForChat(products)
      }
    });
  } catch (error: any) {
    console.error('Shopify featured products error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get featured products'
    });
  }
});

// Cart Management API routes
router.get('/cart', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const sessionId = req.query.sessionId as string;
    
    console.log(`Getting cart for user ${userId}`);
    const cart = await cartService.getOrCreateCart(userId, sessionId);
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error: any) {
    console.error('Get cart error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get cart'
    });
  }
});

router.post('/cart/add', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { productId, variantId, quantity = 1, sessionId } = req.body;
    
    if (!productId || !variantId) {
      return res.status(400).json({ error: 'Product ID and variant ID are required' });
    }

    console.log(`Adding product ${productId} variant ${variantId} to cart for user ${userId}`);
    const cart = await cartService.addToCart(userId, productId, variantId, quantity, sessionId);
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error: any) {
    console.error('Add to cart error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to add item to cart'
    });
  }
});

router.put('/cart/item/:itemId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    console.log(`Updating cart item ${itemId} quantity to ${quantity} for user ${userId}`);
    const cart = await cartService.updateCartItemQuantity(userId, itemId, quantity);
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error: any) {
    console.error('Update cart item error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update cart item'
    });
  }
});

router.delete('/cart/item/:itemId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    
    console.log(`Removing cart item ${itemId} for user ${userId}`);
    const cart = await cartService.removeFromCart(userId, itemId);
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error: any) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to remove item from cart'
    });
  }
});

router.delete('/cart/clear', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    console.log(`Clearing cart for user ${userId}`);
    const cart = await cartService.clearCart(userId);
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error: any) {
    console.error('Clear cart error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to clear cart'
    });
  }
});

// Order Management API routes
router.post('/order/create', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { customerInfo } = req.body;
    
    console.log(`Creating order for user ${userId}`);
    const order = await cartService.convertCartToOrder(userId, customerInfo);
    
    res.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create order'
    });
  }
});

router.get('/orders', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;
    
    console.log(`Getting orders for user ${userId}`);
    const orders = await cartService.getUserOrders(userId, limit);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get orders'
    });
  }
});

router.get('/order/:orderId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { orderId } = req.params;
    
    console.log(`Getting order ${orderId} for user ${userId}`);
    const order = await cartService.getOrderById(orderId);
    
    if (!order || order.userId !== userId) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get order'
    });
  }
});

router.post('/payment/create', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { orderId, paymentData } = req.body;
    
    if (!orderId || !paymentData) {
      return res.status(400).json({ error: 'Order ID and payment data are required' });
    }

    // Verify order belongs to user
    const order = await cartService.getOrderById(orderId);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log(`Creating payment for order ${orderId}`);
    const payment = await cartService.createPayment(orderId, paymentData);
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error: any) {
    console.error('Create payment error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create payment'
    });
  }
});

router.put('/payment/:paymentId/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { paymentId } = req.params;
    const { status, paidAt } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    console.log(`Updating payment ${paymentId} status to ${status}`);
    const payment = await cartService.updatePaymentStatus(paymentId, status, paidAt ? new Date(paidAt) : undefined);
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error: any) {
    console.error('Update payment status error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update payment status'
    });
  }
});

export default router;
