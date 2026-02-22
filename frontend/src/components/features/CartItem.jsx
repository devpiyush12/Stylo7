import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { updateCartItem, removeCartItem } from '../../store/slices/cartSlice';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import Input from '../common/Input';

/**
 * CartItem Component - Display item in cart
 */
const CartItem = ({ item, loading = false }) => {
  const dispatch = useDispatch();

  if (loading) {
    return (
      <div className="flex gap-4 p-4 bg-white rounded-lg animate-pulse">
        <div className="w-24 h-24 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    );
  }

  const {
    product,
    variant,
    quantity,
    price,
    subtotal,
  } = item;

  const primaryImage = product?.images?.find(img => img.isPrimary)?.url || product?.images?.[0]?.url || '/placeholder.jpg';
  const maxQuantity = Math.min(variant?.stock || 10, 10);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1 || newQuantity > maxQuantity) return;
    dispatch(updateCartItem({
      productId: product._id,
      variantId: variant._id,
      quantity: newQuantity,
    }));
  };

  const handleRemove = () => {
    dispatch(removeCartItem({
      productId: product._id,
      variantId: variant._id,
    }));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex gap-4 p-4 bg-white rounded-lg shadow-sm"
    >
      {/* Image */}
      <Link to={`/products/${product?.slug || product?._id}`} className="flex-shrink-0">
        <img
          src={primaryImage}
          alt={product?.name}
          className="w-24 h-24 object-cover rounded-lg"
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link to={`/products/${product?.slug || product?._id}`}>
          <h3 className="font-medium text-gray-900 hover:text-primary-600 transition-colors line-clamp-1">
            {product?.name}
          </h3>
        </Link>
        
        {/* Variant info */}
        {variant && (
          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
            {variant.size && <span>Size: {variant.size}</span>}
            {variant.color && <span>• Color: {variant.color}</span>}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold text-gray-900">₹{price?.toLocaleString()}</span>
          {variant?.comparePrice > price && (
            <span className="text-sm text-gray-400 line-through">
              ₹{variant.comparePrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Stock warning */}
        {variant?.stock <= 5 && variant?.stock > 0 && (
          <p className="text-xs text-orange-600 mt-1">Only {variant.stock} left!</p>
        )}
      </div>

      {/* Quantity & Remove */}
      <div className="flex flex-col items-end justify-between">
        {/* Quantity selector */}
        <div className="flex items-center border border-gray-200 rounded-lg">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="px-3 py-1 text-gray-600 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          <span className="px-3 py-1 text-sm font-medium">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= maxQuantity}
            className="px-3 py-1 text-gray-600 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>

        {/* Subtotal & Remove */}
        <div className="text-right">
          <p className="font-semibold text-gray-900">₹{subtotal?.toLocaleString()}</p>
          <button
            onClick={handleRemove}
            className="text-sm text-red-500 hover:text-red-700 mt-1"
          >
            Remove
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;
