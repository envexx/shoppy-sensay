import { SensayAPIComplete } from '../sensay-api-complete';
import { prisma } from './database';
import ShopifyService from './shopify-service';
import dotenv from 'dotenv';

dotenv.config();

export class SensayService {
  private sensayAPI: SensayAPIComplete;
  private shopifyService: ShopifyService;
  private replicaUUID: string;

  constructor() {
    this.sensayAPI = new SensayAPIComplete();
    this.shopifyService = new ShopifyService();
    this.replicaUUID = process.env.SENSAY_REPLICA_UUID || '50039859-1408-4152-b6ec-1c0fde91cd87';
  }

  /**
   * Get or create Sensay user ID for our app user
   */
  async getOrCreateSensayUser(userId: string): Promise<string> {
    try {
      // Check if user already has Sensay user ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { sensayUserId: true, username: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.sensayUserId) {
        return user.sensayUserId;
      }

      // Create new Sensay user
      console.log('Creating new Sensay user for:', user.username);
      const sensayUser = await this.sensayAPI.createUser(`customer_${userId}_${Date.now()}`);
      
      // Update our user with Sensay user ID
      await prisma.user.update({
        where: { id: userId },
        data: { sensayUserId: sensayUser.id }
      });

      // Log API usage
      await this.logApiUsage(userId, 'create_user', { userId }, sensayUser);

      return sensayUser.id;
    } catch (error) {
      console.error('Error getting/creating Sensay user:', error);
      await this.logApiUsage(userId, 'create_user', { userId }, null, false, (error as Error).message);
      throw error;
    }
  }

  /**
   * Send chat message to Shoppy Sensay
   */
  async sendChatMessage(userId: string, message: string, isNewChat: boolean = false, sessionId?: string, userProducts?: any[]): Promise<any> {
    try {
      // Get Sensay user ID
      const sensayUserId = await this.getOrCreateSensayUser(userId);

      // Enhanced message with Shopify product context
      let enhancedMessage = message;
      let shopifyProducts: any[] = [];

      // Define product keywords for detection
      const productKeywords = ['phone', 'smartphone', 'laptop', 'computer', 'shoes', 'bag', 'watch', 'shirt', 'clothes', 'electronics'];
      const findKeywords = ['find', 'looking for', 'want', 'need', 'show me', 'search'];

      // Detect SPECIFIC product search intent (when user gives detailed requirements OR after conversation)
      const specificSearchIndicators = [
        'show me', 'tampilkan', 'cari yang', 'search for', 'find me',
        'dengan budget', 'with budget', 'harga', 'price range', 'under', 'di bawah',
        'beli sekarang', 'buy now', 'add to cart', 'tambah ke keranjang',
        'rekomendasi', 'recommend', 'suggest', 'pilihkan', 'i want to buy',
        'looking for with', 'need something with', 'budget of', 'around'
      ];

      // Check for specific search intent
      const hasSpecificIntent = specificSearchIndicators.some(indicator => 
        message.toLowerCase().includes(indicator.toLowerCase())
      );

      // Check if message contains detailed requirements (longer, more specific)
      const hasDetailedRequirements = message.length > 25 && (
        message.toLowerCase().includes('untuk') || 
        message.toLowerCase().includes('for') ||
        message.toLowerCase().includes('gaming') ||
        message.toLowerCase().includes('photography') ||
        message.toLowerCase().includes('business') ||
        message.toLowerCase().includes('budget') ||
        message.toLowerCase().includes('range') ||
        message.toLowerCase().includes('style') ||
        message.toLowerCase().includes('work') ||
        message.toLowerCase().includes('daily') ||
        message.toLowerCase().includes('professional')
      );

      // Check if user is providing answers to consultation questions
      const isAnsweringQuestions = message.toLowerCase().includes('mainly') ||
        message.toLowerCase().includes('mostly') ||
        (message.includes('$') && message.includes('-')) ||
        (message.toLowerCase().includes('rp') && (message.includes('-') || message.includes('juta'))) ||
        message.toLowerCase().includes('prefer') ||
        message.toLowerCase().includes('important') ||
        message.toLowerCase().includes('need it for');

      const isProductSearch = hasSpecificIntent || hasDetailedRequirements || isAnsweringQuestions;

      // Initialize response variable
      let response: any;

      if (isProductSearch) {
        try {
          console.log(`Detected product search intent: "${message}"`);
          
          // Search for products in Shopify using the full message
          const searchResults = await this.shopifyService.searchProducts(message, 5);
          shopifyProducts = searchResults;

          if (searchResults.length > 0) {
            // Create custom response with products
            const productMentioned = productKeywords.find(product => 
              message.toLowerCase().includes(product)
            ) || 'products';
            
            const productList = searchResults.map((product, index) => {
              const price = this.shopifyService.formatPrice(
                product.priceRange.minVariantPrice.amount,
                product.priceRange.minVariantPrice.currencyCode
              );
              return `${index + 1}. **${product.title}** - ${price}`;
            }).join('\n');

            response = {
              content: `Perfect! Based on what you're looking for, here are the ${productMentioned} we have in our store:

${productList}

These options match your requirements! Would you like to:
• See more details about any specific product?
• Add any of these to your cart?
• Get recommendations for accessories?

I'm here to help you make the perfect choice! 🛍️✨`
            };
            
            console.log(`Found ${searchResults.length} products for search: "${message}"`);
          } else {
            // No products found in our store
            const productMentioned = productKeywords.find(product => 
              message.toLowerCase().includes(product)
            ) || 'item';
            
            response = {
              content: `I apologize, but we don't currently have any ${productMentioned} matching your specific requirements in our store inventory. 

Our ${productMentioned} collection is temporarily out of stock or we may not carry that particular style yet.

Would you like me to:
• Check for similar alternatives in our current collection?
• Show you other popular items we have available?
• Let you know when we restock this category?

I'm here to help you find something great from what we currently have! 🛍️`
            };
            console.log(`No products found for: "${message}"`);
          }
        } catch (error) {
          console.error('Error searching Shopify products:', error);
          // Fall back to Sensay API if Shopify search fails
          response = await this.sensayAPI.chatWithReplica(
            this.replicaUUID,
            sensayUserId,
            `${message}\n\n[SYSTEM: Shopify search temporarily unavailable, provide general assistance]`
          );
        }
      } else {
        // Send message to Sensay (replica already updated with proper system message)
        console.log(`Sending message to Shoppy Sensay for user ${userId}:`, message);
        response = await this.sensayAPI.chatWithReplica(
          this.replicaUUID,
          sensayUserId,
          enhancedMessage
        );
      }

      // Handle chat session based on request type
      let chatSession;
      
      if (isNewChat) {
        // Always create new session for new chat
        chatSession = await prisma.chatSession.create({
          data: { userId }
        });
        console.log('Created new chat session:', chatSession.id);
      } else if (sessionId) {
        // Use existing session if specified
        chatSession = await prisma.chatSession.findFirst({
          where: { 
            id: sessionId,
            userId 
          }
        });
        
        if (!chatSession) {
          // Session not found or doesn't belong to user, create new one
          chatSession = await prisma.chatSession.create({
            data: { userId }
          });
          console.log('Session not found, created new session:', chatSession.id);
        }
      } else {
        // Default: get or create session (for backward compatibility)
        chatSession = await prisma.chatSession.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' }
        });

        if (!chatSession) {
          chatSession = await prisma.chatSession.create({
            data: { userId }
          });
        }
      }

      // Save user message with detected products
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: 'user',
          content: message,
          products: userProducts && userProducts.length > 0 ? userProducts : undefined
        }
      });

      // Save AI response with product data
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: 'assistant',
          content: response.content,
          sensayResponse: response,
          shopifyProducts: shopifyProducts.length > 0 ? shopifyProducts : undefined
        }
      });

      // Update session timestamp
      await prisma.chatSession.update({
        where: { id: chatSession.id },
        data: { updatedAt: new Date() }
      });

      // Log API usage
      await this.logApiUsage(userId, 'chat', { message }, response);

      return {
        success: true,
        message: response.content,
        sessionId: chatSession.id,
        timestamp: new Date().toISOString(),
        isNewSession: isNewChat, // Flag to indicate if this was a new session
        shopifyProducts: shopifyProducts.length > 0 ? shopifyProducts : undefined // Include Shopify products if found
      };

    } catch (error: any) {
      console.error('Error sending chat message:', error);
      await this.logApiUsage(userId, 'chat', { message }, null, false, error.message);
      
      // Provide user-friendly error messages
      let userMessage = 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.';
      
      if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.name === 'AbortError') {
        userMessage = 'The request timed out. The AI service might be busy. Please try again.';
      } else if (error.message?.includes('fetch failed')) {
        userMessage = 'Unable to connect to the AI service. Please check your internet connection and try again.';
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        userMessage = 'Authentication error. Please try logging out and back in.';
      } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        userMessage = 'Too many requests. Please wait a moment before trying again.';
      }
      
      throw new Error(userMessage);
    }
  }

  /**
   * Get chat history for user
   */
  async getChatHistory(userId: string, sessionId?: string): Promise<any> {
    try {
      let whereClause: any = { userId };
      
      if (sessionId) {
        whereClause.id = sessionId;
      }

      const sessions = await prisma.chatSession.findMany({
        where: whereClause,
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
            select: {
              id: true,
              role: true,
              content: true,
              timestamp: true,
              products: true,
              shopifyProducts: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: sessionId ? 1 : 10 // Limit to 10 recent sessions if no specific session
      });

      // Flatten all messages from all sessions for frontend compatibility
      const allMessages = sessions.flatMap(session => session.messages);

      return allMessages;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  /**
   * Get chat history from Sensay API
   */
  async getSensayChatHistory(userId: string): Promise<any> {
    try {
      const sensayUserId = await this.getOrCreateSensayUser(userId);

      // Get chat history from Sensay API
      const response = await this.sensayAPI.getChatHistory(this.replicaUUID, sensayUserId);
      
      await this.logApiUsage(userId, 'get_chat_history', {}, response);

      return response.items || [];
    } catch (error) {
      console.error('Error getting Sensay chat history:', error);
      await this.logApiUsage(userId, 'get_chat_history', {}, null, false, (error as Error).message);
      throw error;
    }
  }

  /**
   * Get chat sessions summary for user
   */
  async getChatSessions(userId: string): Promise<any> {
    try {
      const sessions = await prisma.chatSession.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1,
            select: {
              content: true,
              timestamp: true,
              role: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 20
      });

      return sessions.map(session => ({
        id: session.id,
        title: this.generateSessionTitle(session.messages[0]?.content || 'Chat Session'),
        lastMessage: session.messages[0]?.content || 'No messages',
        timestamp: session.updatedAt.toISOString(),
        messageCount: session._count.messages
      }));
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      throw error;
    }
  }

  /**
   * Generate a title for chat session based on first message
   */
  private generateSessionTitle(firstMessage: string): string {
    if (firstMessage.length > 30) {
      return firstMessage.substring(0, 30) + '...';
    }
    return firstMessage;
  }

  /**
   * Get user's Sensay analytics
   */
  async getUserAnalytics(userId: string): Promise<any> {
    try {
      const sensayUserId = await this.getOrCreateSensayUser(userId);

      // Get conversations analytics
      const analytics = await this.sensayAPI.getAnalytics(this.replicaUUID, sensayUserId, 'historical');
      
      // Get our local chat stats
      const localStats = await prisma.chatMessage.groupBy({
        by: ['role'],
        where: {
          session: {
            userId
          }
        },
        _count: {
          id: true
        }
      });

      await this.logApiUsage(userId, 'analytics', {}, analytics);

      return {
        sensayAnalytics: analytics,
        localStats,
        summary: {
          totalMessages: localStats.reduce((sum, stat) => sum + stat._count.id, 0),
          userMessages: localStats.find(s => s.role === 'user')?._count.id || 0,
          aiResponses: localStats.find(s => s.role === 'assistant')?._count.id || 0
        }
      };

    } catch (error) {
      console.error('Error getting analytics:', error);
      await this.logApiUsage(userId, 'analytics', {}, null, false, (error as Error).message);
      throw error;
    }
  }

  /**
   * Log API usage for monitoring
   */
  private async logApiUsage(
    userId: string,
    endpoint: string,
    requestData: any,
    responseData: any,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.apiUsage.create({
        data: {
          userId,
          endpoint,
          requestData,
          responseData,
          success,
          errorMessage
        }
      });
    } catch (error) {
      console.error('Error logging API usage:', error);
    }
  }
}
