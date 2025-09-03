// Dynamic API base URL with fallback
const getApiBaseUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  // Fallback to production API when not on localhost
  return 'https://shoppy-sensay.vercel.app/api';
};

const API_BASE_URL = getApiBaseUrl();

interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      username: string;
      sensayUserId?: string;
    };
  };
}

interface ChatResponse {
  success: boolean;
  data: {
    success: boolean;
    message: string;
    sessionId: string;
    timestamp: string;
    isNewSession?: boolean;
    shopifyProducts?: any[];
  };
}

interface ChatHistoryResponse {
  success: boolean;
  data: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
  }>;
}

interface SensayChatHistoryItem {
  content: string;
  created_at: string;
  id: number;
  is_private: boolean;
  role: 'user' | 'assistant';
  source: string;
  sources?: Array<{
    id: number;
    score: number;
    status: string;
    created_at: string;
    name: string;
    content: string;
  }>;
  user_uuid: string;
  original_message_id?: string;
}

interface SensayChatHistoryResponse {
  success: boolean;
  type: string;
  items: SensayChatHistoryItem[];
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

// Analytics interface disabled - analytics API not available
// interface AnalyticsResponse {
//   success: boolean;
//   data: {
//     summary: {
//       totalMessages: number;
//       userMessages: number;
//       aiResponses: number;
//     };
//   };
// }

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export async function register(email: string, username: string, password: string): Promise<AuthResponse> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });
}

export async function login(emailOrUsername: string, password: string): Promise<AuthResponse> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrUsername, password }),
  });
}

export async function getMe() {
  return request('/auth/me');
}

export async function sendChat(message: string, isNewChat?: boolean, sessionId?: string, userProducts?: any[]): Promise<ChatResponse> {
  return request('/chat/send', {
    method: 'POST',
    body: JSON.stringify({ message, isNewChat, sessionId, userProducts }),
  });
}

export async function getChatHistory(sessionId?: string): Promise<ChatHistoryResponse> {
  const url = sessionId ? `/chat/history?sessionId=${sessionId}` : '/chat/history';
  return request(url);
}

export async function getSensayChatHistory(): Promise<SensayChatHistoryResponse> {
  return request('/chat/sensay-history');
}

export async function getChatSessions(): Promise<{ success: boolean; data: ChatSession[] }> {
  return request('/chat/sessions');
}

// Shopify API interfaces
interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  totalInventory: number;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{
      node: {
        url: string;
      };
    }>;
  };
  variants?: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
      };
    }>;
  };
}

interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
}

interface ShopifyOrder {
  id: string;
  name: string;
  displayFulfillmentStatus: string;
  fulfillmentOrders: {
    edges: Array<{
      node: {
        status: string;
        lineItems: {
          edges: Array<{
            node: {
              lineItem: {
                name: string;
              };
            };
          }>;
        };
      };
    }>;
  };
}

interface ShopifySearchResponse {
  success: boolean;
  data: {
    products: ShopifyProduct[];
    count: number;
    formattedResponse: string;
  };
}

// Shopify API functions
export async function searchShopifyProducts(query: string, limit: number = 5): Promise<ShopifySearchResponse> {
  return request('/shopify/search', {
    method: 'POST',
    body: JSON.stringify({ query, limit }),
  });
}

export async function getShopifyProduct(handle: string): Promise<{ success: boolean; data: ShopifyProduct }> {
  return request(`/shopify/product/${handle}`);
}

export async function createShopifyCart(): Promise<{ success: boolean; data: ShopifyCart }> {
  return request('/shopify/cart/create', {
    method: 'POST',
  });
}

export async function addToShopifyCart(cartId: string, variantId: string, quantity: number = 1): Promise<{ success: boolean; data: ShopifyCart }> {
  return request('/shopify/cart/add', {
    method: 'POST',
    body: JSON.stringify({ cartId, variantId, quantity }),
  });
}

export async function getShopifyCart(cartId: string): Promise<{ success: boolean; data: ShopifyCart }> {
  return request(`/shopify/cart/${cartId}`);
}

export async function getShopifyOrderStatus(orderName: string): Promise<{ success: boolean; data: ShopifyOrder }> {
  return request(`/shopify/order/${orderName}`);
}

export async function getFeaturedProducts(limit: number = 10): Promise<ShopifySearchResponse> {
  return request(`/shopify/featured?limit=${limit}`);
}

// Analytics disabled due to API limitations
// export async function getAnalytics(): Promise<AnalyticsResponse> {
//   return request('/analytics');
// }

// Cart Management API functions
export async function getCart(sessionId?: string): Promise<{ success: boolean; data: any }> {
  const url = sessionId ? `/cart?sessionId=${sessionId}` : '/cart';
  return request(url);
}

export async function addToCart(productId: string, variantId: string, quantity: number = 1, sessionId?: string): Promise<{ success: boolean; data: any }> {
  return request('/cart/add', {
    method: 'POST',
    body: JSON.stringify({ productId, variantId, quantity, sessionId }),
  });
}

export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<{ success: boolean; data: any }> {
  return request(`/cart/item/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeFromCart(itemId: string): Promise<{ success: boolean; data: any }> {
  return request(`/cart/item/${itemId}`, {
    method: 'DELETE',
  });
}

export async function clearCart(): Promise<{ success: boolean; data: any }> {
  return request('/cart/clear', {
    method: 'DELETE',
  });
}

// Order Management API functions
export async function createOrder(customerInfo?: any): Promise<{ success: boolean; data: any }> {
  return request('/order/create', {
    method: 'POST',
    body: JSON.stringify({ customerInfo }),
  });
}

export async function getOrders(limit: number = 10): Promise<{ success: boolean; data: any[] }> {
  return request(`/orders?limit=${limit}`);
}

export async function getOrder(orderId: string): Promise<{ success: boolean; data: any }> {
  return request(`/order/${orderId}`);
}

// Payment Management API functions
export async function createPayment(orderId: string, paymentData: any): Promise<{ success: boolean; data: any }> {
  return request('/payment/create', {
    method: 'POST',
    body: JSON.stringify({ orderId, paymentData }),
  });
}

export async function updatePaymentStatus(paymentId: string, status: string, paidAt?: string): Promise<{ success: boolean; data: any }> {
  return request(`/payment/${paymentId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, paidAt }),
  });
}
