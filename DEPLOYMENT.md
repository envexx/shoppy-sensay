# Deployment Guide untuk Vercel

## Masalah yang Diperbaiki

### 1. Prisma Client Generation
- **Masalah**: Prisma Client tidak ter-generate di Vercel
- **Solusi**: Menambahkan `prisma generate` ke script build

### 2. Build Script
- **Sebelum**: `"build": "tsc"`
- **Sesudah**: `"build": "prisma generate && tsc"`

## Environment Variables yang Diperlukan di Vercel

Tambahkan environment variables berikut di Vercel Dashboard:

```bash
# Database
DATABASE_URL=your_production_database_url_here

# Sensay AI
SENSAY_API_KEY=your_sensay_api_key_here
SENSAY_ORG_ID=1a0d6122-b2f7-4724-82d8-543d5630e957

# Shopify
SHOPIFY_STOREFRONT_TOKEN=your_shopify_storefront_token_here
SHOPIFY_ADMIN_TOKEN=your_shopify_admin_token_here
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_SECRET_KEY=your_shopify_secret_key_here

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Node Environment
NODE_ENV=production
```

## Langkah Deployment

1. **Push ke GitHub**:
   ```bash
   git add .
   git commit -m "Fix Vercel deployment"
   git push origin main
   ```

2. **Setup Environment Variables di Vercel**:
   - Buka Vercel Dashboard
   - Pilih project Anda
   - Go to Settings > Environment Variables
   - Tambahkan semua variables di atas

3. **Redeploy**:
   - Vercel akan otomatis redeploy setelah push
   - Atau manual redeploy dari dashboard

## File yang Ditambahkan/Diubah

- `vercel.json` - Konfigurasi Vercel (mengarah ke server/index.js)
- `package.json` - Script build yang diperbaiki
- `DEPLOYMENT.md` - Panduan ini

## Catatan Penting

- **Entry Point**: Server API ada di `src/server/index.ts`, bukan `src/index.ts`
- **Build Output**: File yang di-build adalah `dist/server/index.js`
- **Vercel Config**: Mengarah ke `dist/server/index.js` sebagai entry point

## Setup Deployment Terpisah

### Backend (Netlify Functions):
- **URL**: `https://your-app-name.netlify.app`
- **Health Check**: `https://your-app-name.netlify.app/api/health`
- **CORS**: Menerima request dari frontend domain
- **Platform**: Netlify Functions (Serverless)

### Frontend (React App):
- **URL**: `https://shoppy-sensay.vercel.app`
- **API Base**: Menggunakan `https://your-app-name.netlify.app/api`

## Troubleshooting

### Error yang Sudah Diperbaiki:
- ✅ **"No Output Directory named 'public'"** - Fixed dengan mengarahkan ke `dist/server/index.js`
- ✅ **"functions property cannot be used with builds"** - Fixed dengan menghapus `functions` property

### Jika masih ada masalah:
1. Pastikan semua environment variables sudah di-set
2. Pastikan database URL valid
3. Check Vercel build logs untuk error detail
4. Pastikan entry point mengarah ke `dist/server/index.js`
