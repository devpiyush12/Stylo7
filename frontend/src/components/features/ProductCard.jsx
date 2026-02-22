import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { showToast } from '../../store/slices/uiSlice';
import Badge, { StockBadge } from '../common/Badge';
import Button from '../common/Button';

/**
 * ProductCard Component - Display product in grid
 */
const ProductCard = ({ product, loading = false }) => {
  const dispatch = useDispatch();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
        <div className="h-56 bg-gray-200" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="flex justify-between pt-2">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-8 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  const {
    _id,
    name,
    slug,
    price,
    comparePrice,
    images,
    rating,
    numReviews,
    variants,
    isNew,
    isFeatured,
  } = product;

  const totalStock = variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
  const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
  const primaryImage = images?.find(img => img.isPrimary)?.url || images?.[0]?.url || '/placeholder.jpg';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const defaultVariant = variants?.[0];
    if (!defaultVariant) {
      dispatch(showToast({ type: 'error', message: 'No variant available' }));
      return;
    }

    dispatch(addToCart({
      productId: _id,
      variantId: defaultVariant._id,
      quantity: 1,
    }));
    
    dispatch(showToast({ type: 'success', message: 'Added to cart!' }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-lg shadow-sm overflow-hidden group"
    >
      <Link to={`/products/${slug || _id}`}>
        {/* Image */}
        <div className="relative h-56 bg-gray-100 overflow-hidden">
          <img
            src={primaryImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isNew && <Badge variant="primary">New</Badge>}
            {discount > 0 && <Badge variant="error">-{discount}%</Badge>}
            {isFeatured && <Badge variant="warning">Featured</Badge>}
          </div>

          {/* Quick actions */}
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={handleAddToCart}
              size="sm"
              fullWidth
              disabled={totalStock === 0}
            >
              {totalStock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>

          {/* Wishlist button */}
          <button
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
            onClick={(e) => {
              e.preventDefault();
              // Toggle wishlist
            }}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>
          
          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-500">({numReviews})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-gray-900">₹{price.toLocaleString()}</span>
              {comparePrice > price && (
                <span className="text-sm text-gray-400 line-through">₹{comparePrice.toLocaleString()}</span>
              )}
            </div>
            <StockBadge quantity={totalStock} threshold={5} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
