import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import * as api from '../services/api';

interface OrderItem {
  id: string;
  productTitle: string;
  variantTitle?: string;
  productImage?: string;
  price: number;
  currency: string;
  quantity: number;
}

interface Payment {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paidAt?: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: any;
  items: OrderItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

interface OrderStatusProps {
  orderId?: string;
  onClose?: () => void;
}

const OrderStatus: React.FC<OrderStatusProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAllOrders, setShowAllOrders] = useState(!orderId);

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    } else {
      loadOrders();
    }
  }, [orderId]);

  const loadOrder = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.getOrder(id);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.getOrders(10);
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
      case 'processing':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOrderDetails = (orderData: Order) => (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Order #{orderData.orderNumber}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Placed on {formatDate(orderData.createdAt)}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(orderData.status)}`}>
          {getStatusIcon(orderData.status)}
          <span className="capitalize">{orderData.status}</span>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Order Items</h4>
        <div className="space-y-3">
          {orderData.items.map((item) => (
            <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                {item.productImage ? (
                  <img 
                    src={item.productImage} 
                    alt={item.productTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.productTitle}
                </h5>
                {item.variantTitle && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                    {item.variantTitle}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Qty: {item.quantity}
                </p>
              </div>
              <div className="text-sm font-semibold text-[#71B836]">
                ${(item.price * item.quantity).toFixed(2)} {item.currency}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
          <span className="text-xl font-bold text-[#71B836]">
            ${orderData.totalAmount.toFixed(2)} {orderData.currency}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      {orderData.customerName && (
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Customer Information</h4>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Name:</span> {orderData.customerName}
            </p>
            {orderData.customerEmail && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Email:</span> {orderData.customerEmail}
              </p>
            )}
            {orderData.customerPhone && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Phone:</span> {orderData.customerPhone}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Shipping Address */}
      {orderData.shippingAddress && (
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Shipping Address</h4>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {orderData.shippingAddress.address}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {orderData.shippingAddress.city}, {orderData.shippingAddress.postalCode}
            </p>
          </div>
        </div>
      )}

      {/* Payment Information */}
      {orderData.payments && orderData.payments.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Payment Information</h4>
          <div className="space-y-2">
            {orderData.payments.map((payment) => (
              <div key={payment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {payment.method.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Payment ID: {payment.paymentId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#71B836]">
                      ${payment.amount.toFixed(2)} {payment.currency}
                    </p>
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="capitalize">{payment.status}</span>
                    </div>
                  </div>
                </div>
                {payment.paidAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Paid on {formatDate(payment.paidAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#71B836]" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error</h3>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-[#71B836]" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {showAllOrders ? 'Order History' : 'Order Status'}
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {showAllOrders ? (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No orders found</h3>
                <p className="text-gray-600 dark:text-gray-300">You haven't placed any orders yet.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Order #{order.orderNumber}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#71B836]">
                        ${order.totalAmount.toFixed(2)} {order.currency}
                      </p>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setOrder(order);
                      setShowAllOrders(false);
                    }}
                    className="text-sm text-[#71B836] hover:text-[#5A9A2E] font-medium"
                  >
                    View Details →
                  </button>
                </div>
              ))
            )}
          </div>
        ) : order ? (
          <div>
            {renderOrderDetails(order)}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAllOrders(true)}
                className="text-sm text-[#71B836] hover:text-[#5A9A2E] font-medium"
              >
                ← Back to Order History
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default OrderStatus;
