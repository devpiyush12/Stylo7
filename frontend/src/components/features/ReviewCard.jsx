import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../api';
import Badge, { StatusBadge } from '../common/Badge';
import Button from '../common/Button';

/**
 * ReviewCard Component - Display product review
 */
const ReviewCard = ({ review, showProduct = false, loading = false }) => {
  const [voted, setVoted] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-16 bg-gray-200 rounded mt-3" />
          </div>
        </div>
      </div>
    );
  }

  const {
    _id,
    user,
    product,
    rating,
    title,
    comment,
    images,
    isVerifiedPurchase,
    helpfulCount,
    createdAt,
  } = review;

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-200'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const handleHelpful = async () => {
    if (voted) return;
    try {
      await api.post(`/reviews/${_id}/helpful`);
      setVoted(true);
    } catch (err) {
      console.error('Failed to mark helpful:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-4 border border-gray-100"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary-600">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{user?.name || 'Anonymous'}</span>
              {isVerifiedPurchase && (
                <Badge variant="success" size="sm">Verified Purchase</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex">{renderStars(rating)}</div>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-500">
                {new Date(createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product link (optional) */}
      {showProduct && product && (
        <Link
          to={`/products/${product.slug || product._id}`}
          className="flex items-center gap-2 mt-3 p-2 bg-gray-50 rounded-lg text-sm"
        >
          <img
            src={product.images?.[0]?.url || '/placeholder.jpg'}
            alt={product.name}
            className="w-10 h-10 object-cover rounded"
          />
          <span className="text-gray-600">{product.name}</span>
        </Link>
      )}

      {/* Review content */}
      <div className="mt-3">
        {title && <h4 className="font-medium text-gray-900 mb-1">{title}</h4>}
        <p className="text-sm text-gray-600 leading-relaxed">{comment}</p>
      </div>

      {/* Review images */}
      {images?.length > 0 && (
        <div className="flex gap-2 mt-3">
          {images.map((img, index) => (
            <img
              key={index}
              src={img.url}
              alt={`Review image ${index + 1}`}
              className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
            />
          ))}
        </div>
      )}

      {/* Helpful button */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={handleHelpful}
          disabled={voted}
          className={`flex items-center gap-1.5 text-sm ${
            voted ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'
          }`}
        >
          <svg className="w-4 h-4" fill={voted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span>{voted ? 'Thanks!' : 'Helpful'}</span>
          <span className="text-gray-400">({helpfulCount + (voted ? 1 : 0)})</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ReviewCard;
