const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:5173',
    'http://127.0.0.1:3000', 
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    // Frontend domains
    'https://shoppy-sensay.vercel.app',
    'https://sensay-shop.vercel.app',
    // Netlify preview domains
    'https://*.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
const routes = require('./routes');
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🛍️ Shoppy Sensay API Server (Netlify)',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      chat: {
        send: 'POST /api/chat/send',
        history: 'GET /api/chat/history'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Netlify function handler
exports.handler = async (event, context) => {
  // Connect to database
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Database connection failed:', error);
  }

  // Handle the request using serverless-http
  const serverless = require('serverless-http');
  const handler = serverless(app);
  
  return handler(event, context);
};
