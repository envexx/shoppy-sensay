import { X, Star, DollarSign, Package, ShoppingCart, ExternalLink, Heart, Share2 } from 'lucide-react';
import { useState } from 'react';
import { addToCart } from '../services/api';

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

interface ProductModalProps {
  product: ProductInfo | ShopifyProductInfo;
  isShopifyProduct?: boolean;
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
  onCartUpdate?: () => void;
}

const ProductModal = ({ 
  product, 
  isShopifyProduct = false, 
  isOpen, 
  onClose, 
  sessionId, 
  onCartUpdate 
}: ProductModalProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!isOpen) return null;

  // Helper functions for Shopify products
  const formatShopifyPrice = (amount: string, currencyCode: string): string => {
    const price = parseFloat(amount);
    if (currencyCode === 'IDR') {
      return `Rp ${price.toLocaleString('id-ID')}`;
    }
    if (currencyCode === 'USD') {
      return `$${price.toFixed(2)}`;
    }
    return `${price.toFixed(2)} ${currencyCode}`;
  };

  const getShopifyProductUrl = (handle: string): string => {
    return `https://shoppysensay.myshopify.com/products/${handle}`;
  };

  const handleAddToCart = async () => {
    if (!isShopifyProduct) {
      // For legacy products, show a message that they need to visit the external store
      alert('Please visit the external store to add this product to cart.');
      return;
    }
    
    try {
      setAddingToCart(true);
      
      const shopifyProduct = product as ShopifyProductInfo;
      const variant = selectedVariant 
        ? shopifyProduct.variants?.edges?.find(edge => edge.node.id === selectedVariant)?.node
        : shopifyProduct.variants?.edges?.[0]?.node;
      
      if (!variant || !variant.availableForSale) {
        alert('Selected variant is not available for purchase');
        return;
      }

      console.log('Adding to cart:', {
        productId: shopifyProduct.id,
        variantId: variant.id,
        quantity: quantity,
        sessionId: sessionId
      });

      // If no sessionId, we'll let the backend handle it with userId
      const cartSessionId = sessionId || undefined;

      const response = await addToCart(shopifyProduct.id, variant.id, quantity, sessionId);
      console.log('Add to cart response:', response);
      
      if (response.success) {
        console.log('Product added to cart successfully');
        
        // Show success message without alert to avoid interruption
        // alert(`${shopifyProduct.title} added to cart successfully!`);
        
        if (onCartUpdate) {
          console.log('Calling onCartUpdate');
          onCartUpdate();
        }
        
        // Optionally close the modal after successful add to cart
        // onClose();
      } else {
        console.error('Add to cart failed:', response);
        throw new Error('Failed to add to cart');
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = async () => {
    const url = isShopifyProduct 
      ? getShopifyProductUrl((product as ShopifyProductInfo).handle)
      : (product as ProductInfo).url;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: isShopifyProduct ? (product as ShopifyProductInfo).title : (product as ProductInfo).name,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        alert('Product link copied to clipboard!');
      } catch (error) {
        console.log('Error copying to clipboard:', error);
      }
    }
  };

  const renderShopifyProduct = () => {
    const shopifyProduct = product as ShopifyProductInfo;
    const images = shopifyProduct.images.edges.map(edge => edge.node.url);
    const currentImage = images[selectedImageIndex] || images[0];
    const price = formatShopifyPrice(
      shopifyProduct.priceRange.minVariantPrice.amount,
      shopifyProduct.priceRange.minVariantPrice.currencyCode
    );
    const isAvailable = shopifyProduct.totalInventory > 0;
    const variants = shopifyProduct.variants?.edges || [];

    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Product Details
          </h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-1.5 rounded-md transition-colors ${
                isFavorite 
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
          {/* Product Images */}
          <div className="space-y-3">
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={shopifyProduct.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="w-12 h-12" />
                </div>
              )}
            </div>
            
            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? 'border-[#71B836]'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${shopifyProduct.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {shopifyProduct.title}
              </h1>
              
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                  <DollarSign className="w-4 h-4 text-[#71B836]" />
                  <span className="text-lg font-bold">{price}</span>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isAvailable 
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300'
                }`}>
                  {isAvailable ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              {shopifyProduct.description && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {shopifyProduct.description}
                  </p>
                </div>
              )}
            </div>

            {/* Variants */}
            {variants.length > 1 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Variants
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {variants.map((variantEdge) => {
                    const variant = variantEdge.node;
                    const isSelected = selectedVariant === variant.id;
                    const isVariantAvailable = variant.availableForSale;
                    
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        disabled={!isVariantAvailable}
                        className={`p-2 rounded-md border-2 text-left transition-colors ${
                          isSelected
                            ? 'border-[#71B836] bg-[#71B836]/10 dark:bg-[#71B836]/20'
                            : isVariantAvailable
                            ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            : 'border-gray-200 dark:border-gray-600 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {variant.title}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {formatShopifyPrice(variant.price.amount, variant.price.currencyCode)}
                        </div>
                        {!isVariantAvailable && (
                          <div className="text-xs text-red-500 mt-1">Out of Stock</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Quantity
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center text-sm font-medium text-gray-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !isAvailable}
                className="flex-1 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
              >
                {addingToCart ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : !isAvailable ? (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Out of Stock</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
              
              <a
                href={getShopifyProductUrl(shopifyProduct.handle)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#71B836] hover:bg-[#5A9A2E] dark:bg-[#71B836] dark:hover:bg-[#5A9A2E] text-white text-sm font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-1"
              >
                <span>View Store</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLegacyProduct = () => {
    const legacyProduct = product as ProductInfo;
    
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Product Details
          </h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-1.5 rounded-md transition-colors ${
                isFavorite 
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Product Image */}
          {legacyProduct.image && (
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <img
                src={legacyProduct.image}
                alt={legacyProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Product Info */}
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {legacyProduct.name}
            </h1>
            
            <div className="flex items-center space-x-3 mb-3">
              {legacyProduct.price && (
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                  <DollarSign className="w-4 h-4 text-[#71B836]" />
                  <span className="text-lg font-bold">{legacyProduct.price}</span>
                </div>
              )}
              
              {legacyProduct.rating && (
                <div className="flex items-center space-x-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">{legacyProduct.rating}</span>
                </div>
              )}
              
              {legacyProduct.availability && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300">
                  {legacyProduct.availability}
                </span>
              )}
            </div>

            {legacyProduct.description && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {legacyProduct.description}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="flex-1 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
            >
              {addingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
            
            <a
              href={legacyProduct.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-1"
            >
              <span>View Product</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-h-[90vh] overflow-y-auto">
        {isShopifyProduct ? renderShopifyProduct() : renderLegacyProduct()}
      </div>
    </div>
  );
};

export default ProductModal;
