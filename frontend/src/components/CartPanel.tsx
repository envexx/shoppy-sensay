import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Package } from 'lucide-react';
import * as api from '../services/api';

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productTitle: string;
  variantTitle?: string;
  productImage?: string;
  price: number | string; // Can be number or string from database
  currency: string;
  quantity: number;
}

interface Cart {
  id: string;
  totalAmount: number | string; // Can be number or string from database
  totalItems: number;
  items: CartItem[];
}

interface CartPanelProps {
  sessionId?: string;
  onOrderCreated?: (orderId: string) => void;
  refreshTrigger?: number;
}

const CartPanel: React.FC<CartPanelProps> = ({ sessionId, onOrderCreated, refreshTrigger }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  useEffect(() => {
    loadCart();
  }, [sessionId, refreshTrigger]);

  const loadCart = async () => {
    try {
      setLoading(true);
      console.log('Loading cart with sessionId:', sessionId);
      const response = await api.getCart(sessionId);
      console.log('Cart response:', response);
      if (response.success) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      setLoading(true);
      const response = await api.updateCartItemQuantity(itemId, newQuantity);
      if (response.success) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      setError('Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setLoading(true);
      const response = await api.removeFromCart(itemId);
      if (response.success) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
      setError('Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      const response = await api.clearCart();
      if (response.success) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
      setError('Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const response = await api.createOrder({
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        shippingAddress: {
          address: customerInfo.address,
          city: customerInfo.city,
          postalCode: customerInfo.postalCode
        }
      });

      if (response.success) {
        setCart(null);
        setShowCheckout(false);
        if (onOrderCreated) {
          onOrderCreated(response.data.id);
        }
        alert(`Order created successfully! Order number: ${response.data.orderNumber}`);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      setError('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
          <p className="text-gray-600 dark:text-gray-300">Add some products to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Cart Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-[#71B836]" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Shopping Cart</h3>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="p-4 space-y-4">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {/* Product Image */}
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
              {item.productImage ? (
                <img 
                  src={item.productImage} 
                  alt={item.productTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-8 h-8 text-gray-400" />
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {item.productTitle}
              </h4>
              {item.variantTitle && (
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  {item.variantTitle}
                </p>
              )}
              <p className="text-sm font-semibold text-[#71B836]">
                ${Number(item.price).toFixed(2)} {item.currency}
              </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={loading}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium text-gray-900 dark:text-white">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={loading}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => removeItem(item.id)}
              disabled={loading}
              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
          <span className="text-xl font-bold text-[#71B836]">
            ${Number(cart.totalAmount).toFixed(2)} {cart.items[0]?.currency || 'USD'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => setShowCheckout(true)}
            disabled={loading}
            className="w-full bg-[#71B836] hover:bg-[#5A9A2E] text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Checkout</span>
          </button>
          
          <button
            onClick={clearCart}
            disabled={loading}
            className="w-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Checkout</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#71B836] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#71B836] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#71B836] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#71B836] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={customerInfo.city}
                    onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#71B836] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={customerInfo.postalCode}
                    onChange={(e) => setCustomerInfo({...customerInfo, postalCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#71B836] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Postal Code"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={loading || !customerInfo.name || !customerInfo.email}
                className="flex-1 bg-[#71B836] hover:bg-[#5A9A2E] text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default CartPanel;
