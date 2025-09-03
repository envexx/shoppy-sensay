const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Shoppy Sensay API (Netlify)'
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
    const { sessionId } = req.query;
    
    // TODO: Implement actual chat history logic
    res.json({
      success: true,
      data: [
        {
          id: '1',
          content: 'Hello! How can I help you today?',
          role: 'assistant',
          timestamp: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat history'
    });
  }
});

module.exports = router;
