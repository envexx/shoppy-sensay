const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Shoppy Sensay API (Vercel)'
  });
});

// Auth routes
router.post('/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    // Basic validation
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, username, and password are required'
      });
    }

    // TODO: Implement actual registration logic
    res.json({
      success: true,
      data: {
        token: 'mock-token-' + Date.now(),
        user: {
          id: '1',
          email,
          username,
          sensayUserId: 'sensay-' + Date.now()
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    // Basic validation
    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/username and password are required'
      });
    }

    // TODO: Implement actual login logic
    res.json({
      success: true,
      data: {
        token: 'mock-token-' + Date.now(),
        user: {
          id: '1',
          email: emailOrUsername.includes('@') ? emailOrUsername : emailOrUsername + '@example.com',
          username: emailOrUsername,
          sensayUserId: 'sensay-' + Date.now()
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

router.get('/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // TODO: Implement actual token validation
    res.json({
      success: true,
      data: {
        id: '1',
        email: 'user@example.com',
        username: 'testuser',
        sensayUserId: 'sensay-123'
      }
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// Chat routes
router.post('/chat/send', async (req, res) => {
  try {
    const { message, isNewChat, sessionId, userProducts } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // TODO: Implement actual chat logic
    res.json({
      success: true,
      data: {
        success: true,
        message: 'Mock response: ' + message,
        sessionId: sessionId || 'session-' + Date.now(),
        timestamp: new Date().toISOString(),
        isNewSession: isNewChat || false,
        shopifyProducts: []
      }
    });
  } catch (error) {
    console.error('Chat send error:', error);
    res.status(500).json({
      success: false,
      error: 'Chat failed'
    });
  }
});

router.get('/chat/history', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { sessionId } = req.query;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Get chat history from database
    let messages;
    if (sessionId) {
      // Get messages for specific session
      messages = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        select: {
          id: true,
          content: true,
          role: true,
          timestamp: true
        }
      });
    } else {
      // Get all messages for user (from all sessions)
      messages = await prisma.chatMessage.findMany({
        orderBy: { timestamp: 'asc' },
        take: 50, // Limit to last 50 messages
        select: {
          id: true,
          content: true,
          role: true,
          timestamp: true
        }
      });
    }

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat history'
    });
  }
});

router.get('/chat/sessions', async (req, res) => {
  try {
    // Get user ID from token (simplified for now - in production should validate JWT)
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // For now, we'll get sessions for all users since we don't have proper auth
    // In production, you should validate the token and get the specific user ID
    const sessions = await prisma.chatSession.findMany({
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: {
            content: true,
            timestamp: true,
            role: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      title: generateSessionTitle(session.messages[0]?.content || 'Chat Session'),
      lastMessage: session.messages[0]?.content || 'No messages',
      timestamp: session.updatedAt.toISOString(),
      messageCount: session._count.messages
    }));

    res.json({
      success: true,
      data: formattedSessions
    });
  } catch (error) {
    console.error('Chat sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat sessions'
    });
  }
});

router.get('/chat/sensay-history', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // TODO: Implement actual Sensay chat history logic
    // This would require integrating with Sensay API
    // For now, return mock data structure
    res.json({
      success: true,
      type: 'chat_history',
      items: [
        {
          id: 1,
          content: 'Hello! How can I help you with your shopping today?',
          role: 'assistant',
          created_at: new Date().toISOString(),
          is_private: false,
          source: 'sensay',
          user_uuid: 'mock-user-uuid'
        }
      ]
    });
  } catch (error) {
    console.error('Sensay chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Sensay chat history'
    });
  }
});

// Cart Management API routes
router.get('/cart', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const sessionId = req.query.sessionId;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // TODO: Implement actual cart logic with CartService
    // For now, return mock cart data
    res.json({
      success: true,
      data: {
        id: 'cart-' + Date.now(),
        items: [],
        totalQuantity: 0,
        totalAmount: 0,
        sessionId: sessionId || 'default-session'
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cart'
    });
  }
});

router.post('/cart/add', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { productId, variantId, quantity = 1, sessionId } = req.body;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    if (!productId || !variantId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and variant ID are required'
      });
    }

    // TODO: Implement actual add to cart logic
    res.json({
      success: true,
      data: {
        id: 'cart-' + Date.now(),
        items: [{
          id: 'item-' + Date.now(),
          productId,
          variantId,
          quantity,
          addedAt: new Date().toISOString()
        }],
        totalQuantity: quantity,
        totalAmount: 0
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart'
    });
  }
});

router.put('/cart/item/:itemId', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Quantity is required'
      });
    }

    // TODO: Implement actual update cart item logic
    res.json({
      success: true,
      data: {
        id: 'cart-' + Date.now(),
        items: [{
          id: itemId,
          quantity,
          updatedAt: new Date().toISOString()
        }],
        totalQuantity: quantity,
        totalAmount: 0
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cart item'
    });
  }
});

router.delete('/cart/item/:itemId', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { itemId } = req.params;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // TODO: Implement actual remove from cart logic
    res.json({
      success: true,
      data: {
        id: 'cart-' + Date.now(),
        items: [],
        totalQuantity: 0,
        totalAmount: 0,
        removedItemId: itemId
      }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart'
    });
  }
});

router.delete('/cart/clear', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // TODO: Implement actual clear cart logic
    res.json({
      success: true,
      data: {
        id: 'cart-' + Date.now(),
        items: [],
        totalQuantity: 0,
        totalAmount: 0,
        clearedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart'
    });
  }
});

// Order Management API routes
router.post('/order/create', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { customerInfo } = req.body;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // TODO: Implement actual order creation logic
    res.json({
      success: true,
      data: {
        id: 'order-' + Date.now(),
        status: 'pending',
        customerInfo: customerInfo || {},
        createdAt: new Date().toISOString(),
        totalAmount: 0
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const limit = parseInt(req.query.limit) || 10;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // TODO: Implement actual orders retrieval logic
    // For now, return mock orders data
    const mockOrders = Array.from({ length: Math.min(limit, 3) }, (_, index) => ({
      id: `order-${Date.now()}-${index}`,
      status: ['pending', 'processing', 'completed'][index % 3],
      totalAmount: (index + 1) * 100,
      createdAt: new Date(Date.now() - index * 86400000).toISOString(),
      items: [
        {
          id: `item-${index}`,
          name: `Product ${index + 1}`,
          quantity: index + 1,
          price: 100
        }
      ]
    }));

    res.json({
      success: true,
      data: mockOrders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders'
    });
  }
});

router.get('/order/:orderId', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { orderId } = req.params;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // TODO: Implement actual order retrieval logic
    res.json({
      success: true,
      data: {
        id: orderId,
        status: 'completed',
        totalAmount: 250,
        createdAt: new Date().toISOString(),
        items: [
          {
            id: 'item-1',
            name: 'Sample Product',
            quantity: 2,
            price: 125
          }
        ],
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order'
    });
  }
});

// Payment Management API routes
router.post('/payment/create', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { orderId, paymentData } = req.body;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    if (!orderId || !paymentData) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and payment data are required'
      });
    }

    // TODO: Implement actual payment creation logic
    res.json({
      success: true,
      data: {
        id: 'payment-' + Date.now(),
        orderId,
        status: 'pending',
        amount: paymentData.amount || 0,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment'
    });
  }
});

router.put('/payment/:paymentId/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { paymentId } = req.params;
    const { status, paidAt } = req.body;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // TODO: Implement actual payment status update logic
    res.json({
      success: true,
      data: {
        id: paymentId,
        status: status || 'completed',
        paidAt: paidAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment status'
    });
  }
});

// Helper function to generate session title
function generateSessionTitle(firstMessage) {
  if (firstMessage.length > 30) {
    return firstMessage.substring(0, 30) + '...';
  }
  return firstMessage;
}

module.exports = router;
