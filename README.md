# 🛍️ Shoppy Sensay - AI Shopping Assistant

A smart AI-powered shopping assistant that helps customers find the best products from your Shopify store. Built with React, Node.js, and powered by Sensay AI.

## 🧬 How It Works

### Core Functionality
Shoppy Sensay is an intelligent shopping chatbot that:

1. **Understands Customer Intent**: Uses advanced AI to interpret customer requests, from vague ("I need clothes") to specific ("blue skinny jeans for work")

2. **Smart Product Search**: Automatically searches your Shopify store inventory based on customer needs and preferences

3. **Intelligent Consultation**: Asks minimal, focused questions to understand customer requirements without overwhelming them

4. **Real-time Product Display**: Shows relevant products with images, prices, and detailed information directly in the chat

5. **Seamless Shopping Experience**: Allows customers to add products to cart, view details in modal, and complete purchases without leaving the chat

### Use Cases

- **E-commerce Customer Support**: Help customers find products quickly and efficiently
- **Product Discovery**: Guide customers to discover new products they might like
- **Sales Consultation**: Provide personalized product recommendations based on customer needs
- **Shopping Assistance**: Assist with product comparisons, sizing, and availability
- **Order Management**: Help customers track orders and manage their shopping experience

### AI Behavior

The chatbot is designed to be:
- **Concise and Helpful**: Provides quick, relevant results
- **Intelligent**: Makes smart assumptions about customer needs
- **Store-Focused**: Only recommends products from your Shopify store
- **Professional**: Maintains enthusiasm while staying business-focused

## 🧑‍💻 Sensay API Organisation ID

**Organisation ID**: `1a0d6122-b2f7-4724-82d8-543d5630e957`

This ID is used to connect with the Sensay AI platform for intelligent conversation handling and product recommendations.

## 📑 Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database
- Shopify store with Storefront API access
- Sensay AI account

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sensay-shop
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sensay_shop"

# Sensay AI
SENSAY_API_KEY="your_sensay_api_key"
SENSAY_ORG_ID="1a0d6122-b2f7-4724-82d8-543d5630e957"

# Shopify
SHOPIFY_STOREFRONT_TOKEN="your_shopify_storefront_token"
SHOPIFY_ADMIN_TOKEN="your_shopify_admin_token"
SHOPIFY_API_KEY="your_shopify_api_key"
SHOPIFY_SECRET_KEY="your_shopify_secret_key"

# JWT Secret
JWT_SECRET="your_jwt_secret_key"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
```

### 5. Build the Application

```bash
# Build backend
npm run build

# Build frontend
cd frontend
npm run build
cd ..
```

### 6. Start the Application

```bash
# Start backend server (runs on port 3001)
npm start

# In another terminal, start frontend development server (runs on port 5173)
cd frontend
npm run dev
```

### 7. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## 🏗️ Project Structure

```
sensay-shop/
├── src/                    # Backend source code
│   ├── server/            # Server components
│   │   ├── auth.ts        # Authentication logic
│   │   ├── cart-service.ts # Cart management
│   │   ├── database.ts    # Database connection
│   │   ├── routes.ts      # API routes
│   │   ├── sensay-service.ts # Sensay AI integration
│   │   └── shopify-service.ts # Shopify integration
│   ├── config.ts          # Configuration
│   └── index.ts           # Main server file
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── prisma/                # Database schema and migrations
└── package.json           # Dependencies and scripts
```

## 🔧 Key Features

### Frontend
- **Modern React UI**: Built with React 18, TypeScript, and Tailwind CSS
- **Real-time Chat**: Interactive chat interface with message history
- **Product Modal**: Detailed product view with add-to-cart functionality
- **Shopping Cart**: Full cart management with quantity controls
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Automatic dark/light theme switching

### Backend
- **RESTful API**: Clean API endpoints for all operations
- **Authentication**: JWT-based user authentication
- **Database Integration**: PostgreSQL with Prisma ORM
- **Shopify Integration**: Real-time product search and inventory
- **Sensay AI Integration**: Intelligent conversation handling
- **Cart Management**: Full e-commerce cart functionality

### AI Capabilities
- **Smart Product Search**: Understands customer intent and searches accordingly
- **Contextual Recommendations**: Provides relevant product suggestions
- **Natural Language Processing**: Handles various customer query formats
- **Learning Capabilities**: Improves recommendations based on interactions

## 🚀 Deployment

### Production Build

```bash
# Build everything for production
npm run build
cd frontend && npm run build && cd ..

# Start production server
npm start
```

### Environment Variables for Production

Ensure all environment variables are properly set in your production environment, especially:
- `DATABASE_URL`
- `SENSAY_API_KEY`
- `SHOPIFY_*` tokens
- `JWT_SECRET`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Chat
- `POST /api/chat/send` - Send message to AI
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/sessions` - Get chat sessions

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add product to cart
- `PUT /api/cart/item/:id` - Update cart item
- `DELETE /api/cart/item/:id` - Remove cart item

### Shopify
- `POST /api/shopify/search` - Search products
- `GET /api/shopify/product/:handle` - Get product details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

---

**Built with ❤️ using React, Node.js, and Sensay AI**