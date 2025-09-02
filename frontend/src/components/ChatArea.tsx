import React, { useState, useEffect, useRef } from 'react';
import { 
  Smile, 
  Paperclip, 
  Send, 
  Mic,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Package
} from 'lucide-react';
import * as api from '../services/api';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import CartPanel from './CartPanel';
import OrderStatus from './OrderStatus';
import { detectShoppingLinks, extractProductFromMessage } from '../utils/linkDetector';
import MarkdownText from '../utils/markdownParser';

interface User {
  id: string;
  email: string;
  username: string;
  sensayUserId?: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  products?: ProductInfo[];
  shopifyProducts?: ShopifyProductInfo[];
}

interface ShopifyProductInfo {
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

interface ProductInfo {
  id: string;
  name: string;
  price?: string;
  image?: string;
  url: string;
  description?: string;
  rating?: number;
  availability?: string;
}

interface ChatAreaProps {
  selectedChat: string;
  user: User | null;
  isNewChat?: boolean;
  onSessionCreated?: (sessionId: string) => void;
}

const ChatArea = ({ selectedChat, user, isNewChat = false, onSessionCreated }: ChatAreaProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | ShopifyProductInfo | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSelectedProductShopify, setIsSelectedProductShopify] = useState(false);
  const [cartRefreshTrigger, setCartRefreshTrigger] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to detect products in a message
  const detectProductsInMessage = (content: string): ProductInfo[] => {
    // detectShoppingLinks already returns ProductInfo[]
    const detectedProducts = detectShoppingLinks(content);
    
    // Also try to extract product recommendations from AI responses
    const extractedProducts = extractProductFromMessage(content);
    
    // Combine both types of detection
    return [...detectedProducts, ...extractedProducts];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user && !isNewChat && selectedChat && selectedChat !== 'new-chat') {
      loadChatHistory(selectedChat);
    } else if (isNewChat || selectedChat === 'new-chat') {
      // Clear messages for new chat
      setMessages([]);
    }
  }, [user, selectedChat, isNewChat]);

  const loadChatHistory = async (sessionId: string) => {
    if (!user) return;
    
    try {
      // Load specific session history
      const response = await api.getChatHistory(sessionId);
      console.log('Chat history response for session:', sessionId, response); // Debug log
      if (response.success && response.data) {
        // Use stored product data from database, don't re-detect
        const messagesWithProducts = response.data.map((msg: any) => {
          return {
            id: msg.id,
            content: msg.content,
            role: msg.role,
            timestamp: msg.timestamp,
            // Use stored product data from database
            products: msg.products || undefined,
            shopifyProducts: msg.shopifyProducts || undefined
          };
        });
        setMessages(messagesWithProducts);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // If session not found, clear messages
      setMessages([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading || !user) return;

    const messageContent = message.trim();
    const detectedProducts = detectProductsInMessage(messageContent);
    
    const userMessage: Message = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}_${performance.now()}`,
      content: messageContent,
      role: 'user',
      timestamp: new Date().toISOString(),
      products: detectedProducts.length > 0 ? detectedProducts : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);
    setError('');

    // If this is a new chat and it's the first message, this will automatically create a new session
    // The backend will handle session creation in the sendChat endpoint

    try {
      // Determine if this is a new chat or continuing existing session
      const isNewChatMode = isNewChat || selectedChat === 'new-chat';
      const currentSessionId = !isNewChatMode && selectedChat !== 'new-chat' ? selectedChat : undefined;
      
      const response = await api.sendChat(userMessage.content, isNewChatMode, currentSessionId, userMessage.products);
      console.log('Chat response:', response, { isNewChatMode, currentSessionId }); // Debug log
      if (response.success && response.data) {
        const aiContent = response.data.message;
        const aiDetectedProducts = detectProductsInMessage(aiContent);
        
        const aiMessage: Message = {
          id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 11)}_${performance.now()}`,
          content: aiContent,
          role: 'assistant',
          timestamp: response.data.timestamp,
          products: aiDetectedProducts.length > 0 ? aiDetectedProducts : undefined,
          shopifyProducts: response.data.shopifyProducts // Include Shopify products from response
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // If this was a new session, notify parent to switch to it
        if (response.data.isNewSession && response.data.sessionId && onSessionCreated) {
          console.log('New session created, switching to:', response.data.sessionId);
          onSessionCreated(response.data.sessionId);
        }
        
        // Product detection is now handled inline with ProductCard
      } else {
        console.error('Invalid response structure:', response);
        setError('Received invalid response from server');
      }
    } catch (error) {
      setError('Failed to send message. Please try again.');
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCartUpdate = () => {
    // Cart has been updated, you can add any additional logic here
    console.log('Cart updated, refreshing cart panel');
    // Force a re-render of the cart panel by incrementing the refresh trigger
    // Use setTimeout to debounce rapid updates
    setTimeout(() => {
      setCartRefreshTrigger(prev => prev + 1);
    }, 100);
  };

  const handleOrderCreated = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowOrders(true);
    setShowCart(false);
  };

  const handleProductClick = (product: ProductInfo | ShopifyProductInfo, isShopify: boolean = false) => {
    setSelectedProduct(product);
    setIsSelectedProductShopify(isShopify);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
    setIsSelectedProductShopify(false);
  };

  if (!user) {
    return (
      <div className="h-full flex flex-col bg-slate-800/30 backdrop-blur-xl">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h3 className="text-xl font-bold mb-2 font-sora text-white">Welcome to Shoppy Sensay</h3>
            <p className="text-slate-300">Please login to start chatting with your AI shopping assistant</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-transparent overflow-hidden">
      {/* Header with Cart and Order buttons */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-5 h-5 text-[#71B836]" />
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Shoppy Sensay</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setShowCart(!showCart);
              setShowOrders(false);
            }}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-[#71B836] hover:bg-[#71B836]/10 rounded-lg transition-colors"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setShowOrders(!showOrders);
              setShowCart(false);
            }}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-[#71B836] hover:bg-[#71B836]/10 rounded-lg transition-colors"
            title="Order History"
          >
            <Package className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Messages */}
        <div className={`flex-1 overflow-y-auto ultra-thin-scrollbar p-6 space-y-4 min-h-0 ${showCart || showOrders ? 'hidden md:block' : ''}`}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            {isNewChat || selectedChat === 'new-chat' ? (
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-[#71B836]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-[#71B836]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-sora">Welcome to Shoppy Sensay!</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  I'm your smart shopping assistant! I can help you find the best products, 
                  compare prices, and make informed purchasing decisions. What would you like to shop for today?
                </p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="bg-[#71B836]/10 dark:bg-[#71B836]/20 border border-[#71B836]/30 dark:border-[#71B836]/50 rounded-lg p-3 text-left">
                    <p className="text-[#71B836] dark:text-[#71B836]/80 font-medium">💡 Try asking me:</p>
                    <p className="text-[#71B836] dark:text-[#71B836]/70">"Find me a good laptop under $1000"</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3 text-left">
                    <p className="text-green-700 dark:text-green-300 font-medium">🔍 Or say:</p>
                    <p className="text-green-600 dark:text-green-400">"Show me the best smartphones in 2025"</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-start w-full">
                <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                  <p className="text-sm">Hello! I'm Shoppy Sensay, your smart shopping assistant! 🛍️ I'm here to help you find the best products at great prices. What are you looking to buy today?</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Session Header */}
            {!isNewChat && selectedChat !== 'new-chat' && (
              <div className="flex justify-center mb-6">
                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#71B836] rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      Chat Session Started
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {messages.length > 0 ? formatTime(messages[0].timestamp) : 'Now'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                <div
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-[#71B836] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <div>
                    {msg.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">
                        <MarkdownText content={msg.content} />
                      </div>
                    )}
                  </div>
                  <p className={`text-xs mt-2 ${
                    msg.role === 'user' ? 'text-[#71B836]/20' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
              
              {/* Product Cards */}
              {msg.products && msg.products.length > 0 && (
                <div className="w-full">
                  <ProductCard 
                    products={msg.products} 
                    sessionId={selectedChat !== 'new-chat' ? selectedChat : undefined}
                    onCartUpdate={handleCartUpdate}
                    onProductClick={handleProductClick}
                  />
                </div>
              )}
              
              {/* Shopify Product Cards */}
              {msg.shopifyProducts && msg.shopifyProducts.length > 0 && (
                <div className="w-full">
                  <ProductCard 
                    products={msg.shopifyProducts} 
                    isShopifyProducts={true}
                    sessionId={selectedChat !== 'new-chat' ? selectedChat : undefined}
                    onCartUpdate={handleCartUpdate}
                    onProductClick={handleProductClick}
                  />
                </div>
              )}
            </div>
            ))}
          </>
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-[#71B836]/80 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#71B836]/80 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-[#71B836]/80 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Shoppy is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm">
              {error}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
        </div>

        {/* Cart Panel */}
        {showCart && (
          <div className="w-full md:w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
            <CartPanel 
              sessionId={selectedChat !== 'new-chat' ? selectedChat : undefined}
              onOrderCreated={handleOrderCreated}
              refreshTrigger={cartRefreshTrigger}
            />
          </div>
        )}

        {/* Order Status Panel */}
        {showOrders && (
          <div className="w-full md:w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
            <OrderStatus 
              orderId={selectedOrderId}
              onClose={() => {
                setShowOrders(false);
                setSelectedOrderId(undefined);
              }}
            />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="relative p-6 
            border border-gray-200 dark:border-white/30 
            bg-white/30 dark:bg-gray-900/30 
            backdrop-blur-md 
            flex-shrink-0 
            shadow-sm 
            rounded-xl">
        {/* Enhanced Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-2xl"></div>
        
        <form onSubmit={handleSendMessage} className="relative z-10 flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about any product you're looking for..."
              className="w-full px-4 py-3 glass-morphism-enhanced rounded-full text-gray-900 dark:text-gray-100 placeholder-gray-600 dark:placeholder-gray-400 text-sm pr-20 focus:outline-none focus:ring-2 focus:ring-[#71B836]/50 focus:border-white/50 transition-all duration-300 shadow-sm"
              disabled={loading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <button type="button" className="p-1 hover:bg-white/20 rounded-full transition-all duration-200 backdrop-blur-sm">
                <Smile className="w-5 h-5 text-gray-600 hover:text-gray-800" />
              </button>
              <button type="button" className="p-1 hover:bg-white/20 rounded-full transition-all duration-200 backdrop-blur-sm">
                <Paperclip className="w-5 h-5 text-gray-600 hover:text-gray-800" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button type="button" className="p-3 glass-morphism-enhanced rounded-full transition-all duration-300 hover:scale-110">
              <Mic className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" />
            </button>
            <button
              type="submit"
              className="p-3 bg-gradient-to-r from-[#71B836]/90 to-[#71B836]/90 hover:from-[#71B836] hover:to-[#71B836]/80 rounded-full text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:scale-110 backdrop-blur-sm"
              disabled={loading || !message.trim()}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
        
        <div className="relative z-10 flex items-center justify-center mt-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-1 glass-morphism-enhanced px-3 py-1 rounded-full">
            <Shield className="w-3 h-3" />
            <span>Powered by Sensay AI • Secure & Private Shopping Assistant</span>
          </p>
        </div>
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isShopifyProduct={isSelectedProductShopify}
          isOpen={isProductModalOpen}
          onClose={handleCloseProductModal}
          sessionId={selectedChat !== 'new-chat' ? selectedChat : undefined}
          onCartUpdate={handleCartUpdate}
        />
      )}
    </div>
  );
};

export default ChatArea;