// Vercel entry point - redirects to the actual server
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Import the actual server
const app = require('./dist/server/index.js').default;

// Create server
const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // Handle API routes
  if (pathname.startsWith('/api')) {
    return app(req, res);
  }

  // Handle root route
  if (pathname === '/') {
    return app(req, res);
  }

  // Handle all other routes
  return app(req, res);
});

// Export for Vercel
module.exports = server;
