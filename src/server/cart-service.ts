import { prisma } from './database';
import ShopifyService from './shopify-service';

export class CartService {
  private shopifyService: ShopifyService;

  constructor() {
    this.shopifyService = new ShopifyService();
  }

  /**
   * Get or create active cart for user
   */
  async getOrCreateCart(userId: string, sessionId?: string) {
    try {
      // Try to find active cart for user, prioritizing sessionId if provided
      let cart = await prisma.cart.findFirst({
        where: {
          userId,
          ...(sessionId && { sessionId }),
          status: 'ACTIVE'
        },
        include: {
          items: true
        }
      });

      // If no cart found with sessionId, try to find any active cart for user
      if (!cart && sessionId) {
        cart = await prisma.cart.findFirst({
          where: {
            userId,
            status: 'ACTIVE'
          },
          include: {
            items: true
          }
        });
      }

      if (!cart) {
        // Create new cart
        cart = await prisma.cart.create({
          data: {
            userId,
            sessionId
          },
          include: {
            items: true
          }
        });
      }

      return cart;
    } catch (error) {
      console.error('Error getting/creating cart:', error);
      throw error;
    }
  }

  /**
   * Add product to cart
   */
  async addToCart(userId: string, productId: string, variantId: string, quantity: number = 1, sessionId?: string) {
    try {
      // Get product details from Shopify
      const product = await this.shopifyService.getProductById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Find variant
      const variant = product.variants?.edges?.find((edge: any) => edge.node.id === variantId)?.node;
      if (!variant) {
        throw new Error('Product variant not found');
      }

      // Get or create cart
      const cart = await this.getOrCreateCart(userId, sessionId);

      // Check if item already exists in cart
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          variantId
        }
      });

      if (existingItem) {
        // Update quantity
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity }
        });
      } else {
        // Add new item
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            variantId,
            productTitle: product.title,
            variantTitle: variant.title,
            productHandle: product.handle,
            productImage: product.images.edges[0]?.node.url,
            price: parseFloat(variant.price.amount),
            currency: variant.price.currencyCode,
            quantity
          }
        });
      }

      // Update cart totals
      await this.updateCartTotals(cart.id);

      return await this.getCartById(cart.id);
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, cartItemId: string) {
    try {
      // Verify cart belongs to user
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: cartItemId,
          cart: {
            userId
          }
        },
        include: {
          cart: true
        }
      });

      if (!cartItem) {
        throw new Error('Cart item not found');
      }

      // Remove item
      await prisma.cartItem.delete({
        where: { id: cartItemId }
      });

      // Update cart totals
      await this.updateCartTotals(cartItem.cart.id);

      return await this.getCartById(cartItem.cart.id);
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  /**
   * Update item quantity in cart
   */
  async updateCartItemQuantity(userId: string, cartItemId: string, quantity: number) {
    try {
      if (quantity <= 0) {
        return await this.removeFromCart(userId, cartItemId);
      }

      // Verify cart belongs to user
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: cartItemId,
          cart: {
            userId
          }
        },
        include: {
          cart: true
        }
      });

      if (!cartItem) {
        throw new Error('Cart item not found');
      }

      // Update quantity
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity }
      });

      // Update cart totals
      await this.updateCartTotals(cartItem.cart.id);

      return await this.getCartById(cartItem.cart.id);
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw error;
    }
  }

  /**
   * Get cart by ID
   */
  async getCartById(cartId: string) {
    try {
      return await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error getting cart by ID:', error);
      throw error;
    }
  }

  /**
   * Get user's active cart
   */
  async getUserCart(userId: string) {
    try {
      return await prisma.cart.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        },
        include: {
          items: true
        }
      });
    } catch (error) {
      console.error('Error getting user cart:', error);
      throw error;
    }
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string) {
    try {
      const cart = await this.getUserCart(userId);
      if (!cart) {
        return null;
      }

      // Remove all items
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      // Update cart totals
      await this.updateCartTotals(cart.id);

      return await this.getCartById(cart.id);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  /**
   * Update cart totals
   */
  private async updateCartTotals(cartId: string) {
    try {
      const items = await prisma.cartItem.findMany({
        where: { cartId }
      });

      const totalAmount = items.reduce((sum, item) => {
        return sum + (Number(item.price) * item.quantity);
      }, 0);

      const totalItems = items.reduce((sum, item) => {
        return sum + item.quantity;
      }, 0);

      await prisma.cart.update({
        where: { id: cartId },
        data: {
          totalAmount,
          totalItems
        }
      });
    } catch (error) {
      console.error('Error updating cart totals:', error);
      throw error;
    }
  }

  /**
   * Convert cart to order
   */
  async convertCartToOrder(userId: string, customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    shippingAddress?: any;
  }) {
    try {
      const cart = await this.getUserCart(userId);
      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create order
      const order = await prisma.order.create({
        data: {
          userId,
          cartId: cart.id,
          orderNumber,
          totalAmount: cart.totalAmount,
          customerName: customerInfo?.name,
          customerEmail: customerInfo?.email,
          customerPhone: customerInfo?.phone,
          shippingAddress: customerInfo?.shippingAddress
        }
      });

      // Create order items
      for (const item of cart.items) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            productTitle: item.productTitle,
            variantTitle: item.variantTitle,
            productHandle: item.productHandle,
            productImage: item.productImage,
            price: item.price,
            currency: item.currency,
            quantity: item.quantity
          }
        });
      }

      // Mark cart as converted
      await prisma.cart.update({
        where: { id: cart.id },
        data: { status: 'CONVERTED' }
      });

      return await this.getOrderById(order.id);
    } catch (error) {
      console.error('Error converting cart to order:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string) {
    try {
      return await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payments: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error getting order by ID:', error);
      throw error;
    }
  }

  /**
   * Get user orders
   */
  async getUserOrders(userId: string, limit: number = 10) {
    try {
      return await prisma.order.findMany({
        where: { userId },
        include: {
          items: true,
          payments: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string, shopifyOrderId?: string) {
    try {
      return await prisma.order.update({
        where: { id: orderId },
        data: {
          status: status as any,
          shopifyOrderId
        }
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Create payment record
   */
  async createPayment(orderId: string, paymentData: {
    paymentId: string;
    amount: number;
    method: string;
    gateway?: string;
    transactionId?: string;
    reference?: string;
  }) {
    try {
      return await prisma.payment.create({
        data: {
          orderId,
          paymentId: paymentData.paymentId,
          amount: paymentData.amount,
          method: paymentData.method,
          gateway: paymentData.gateway,
          transactionId: paymentData.transactionId,
          reference: paymentData.reference
        }
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId: string, status: string, paidAt?: Date) {
    try {
      return await prisma.payment.update({
        where: { paymentId },
        data: {
          status: status as any,
          paidAt
        }
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }
}

export default CartService;
