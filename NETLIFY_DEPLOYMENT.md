# 🚀 Netlify Deployment Guide

Panduan lengkap untuk deploy backend Shoppy Sensay ke Netlify menggunakan Netlify Functions.

## 📋 Prerequisites

- Akun Netlify
- Repository GitHub/GitLab yang sudah terhubung
- Node.js 18+ (untuk development lokal)

## 🔧 Setup Netlify Functions

### 1. Struktur File
```
netlify/
├── functions/
│   ├── index.js          # Main function handler
│   ├── routes.js         # API routes
│   └── package.json      # Dependencies
└── netlify.toml          # Netlify configuration
```

### 2. Konfigurasi netlify.toml
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## 🚀 Deployment Steps

### 1. Connect Repository
1. Login ke [Netlify Dashboard](https://app.netlify.com)
2. Klik "New site from Git"
3. Pilih repository Anda
4. Konfigurasi build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

### 2. Environment Variables
Tambahkan environment variables di Netlify Dashboard:
```
NODE_ENV=production
DATABASE_URL=your_database_url
SENSAY_API_KEY=your_sensay_api_key
SHOPIFY_STORE_URL=your_shopify_store_url
SHOPIFY_ACCESS_TOKEN=your_shopify_token
```

### 3. Deploy
1. Netlify akan otomatis build dan deploy
2. Tunggu hingga deployment selesai
3. Dapatkan URL: `https://your-app-name.netlify.app`

## 🔗 Update Frontend Configuration

### 1. Update API URL
Di `frontend/src/services/api.ts`:
```typescript
const getApiBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  // Ganti 'your-app-name' dengan nama app Netlify Anda
  return 'https://your-app-name.netlify.app/api';
};
```

### 2. Update CORS Configuration
Di `netlify/functions/index.js`, pastikan CORS mengizinkan domain frontend:
```javascript
origin: [
  'https://shoppy-sensay.vercel.app',
  'https://sensay-shop.vercel.app',
  'https://*.netlify.app'
]
```

## 🧪 Testing

### 1. Health Check
```bash
curl https://your-app-name.netlify.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-09-03T...",
  "service": "Shoppy Sensay API (Netlify)"
}
```

### 2. Authentication Test
```bash
curl -X POST https://your-app-name.netlify.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"test@example.com","password":"password"}'
```

## 🔧 Local Development

### 1. Install Netlify CLI
```bash
npm install -g netlify-cli
```

### 2. Run Locally
```bash
netlify dev
```

### 3. Test Local Functions
```bash
curl http://localhost:8888/api/health
```

## 📊 Monitoring

### 1. Netlify Dashboard
- Monitor function invocations
- View logs dan errors
- Check performance metrics

### 2. Function Logs
```bash
netlify functions:list
netlify functions:invoke index
```

## 🚨 Troubleshooting

### Common Issues:

1. **Function Timeout**
   - Netlify Functions memiliki timeout 10 detik (Pro: 15 detik)
   - Optimize database queries
   - Use connection pooling

2. **CORS Errors**
   - Pastikan domain frontend ada di CORS configuration
   - Check preflight requests

3. **Database Connection**
   - Pastikan DATABASE_URL environment variable sudah benar
   - Test connection di local development

4. **Build Failures**
   - Check Node.js version (harus 18+)
   - Verify all dependencies terinstall
   - Check build logs di Netlify Dashboard

## 🎯 Benefits of Netlify Functions

- ✅ **Automatic HTTPS**: Semua request otomatis HTTPS
- ✅ **Global CDN**: Fast response times worldwide
- ✅ **Serverless**: No server management needed
- ✅ **Auto-scaling**: Handles traffic spikes automatically
- ✅ **Easy deployment**: Git-based deployment
- ✅ **Built-in monitoring**: Function logs dan metrics

## 📝 Next Steps

1. Deploy ke Netlify
2. Update frontend API URL
3. Test semua endpoints
4. Monitor performance
5. Setup custom domain (optional)

---

**Note**: Ganti `your-app-name` dengan nama aplikasi Netlify yang sebenarnya di semua konfigurasi.
