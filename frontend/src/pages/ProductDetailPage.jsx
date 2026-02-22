import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProductBySlug, fetchProducts } from '../store/slices/productsSlice';
import { addToCart } from '../store/slices/cartSlice';
import { showToast } from '../store/slices/uiSlice';
import { PageLoader } from '../components/common/Loader';
import { ProductCard, ReviewCard } from '../components/features';
import Button from '../components/common/Button';
import Badge, { StockBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { formatPrice, calculateDiscount } from '../utils';

/**
 * ProductDetailPage - Single product view
 */
const ProductDetailPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  
  const { currentProduct: product, loading } = useSelector((state) => state.products);
  const { products: relatedProducts } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
    dispatch(fetchProducts({ limit: 4 }));
  }, [dispatch, slug]);

  useEffect(() => {
    if (product?.variants?.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  if (loading) return <PageLoader />;
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const {
    name,
    description,
    price,
    comparePrice,
    images,
    variants,
    rating,
    numReviews,
    reviews,
    category,
    stock,
  } = product;

  const discount = calculateDiscount(price, comparePrice);
  const totalStock = variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;

  const handleAddToCart = () => {
    if (!selectedVariant) {
      dispatch(showToast({ type: 'error', message: 'Please select a variant' }));
      return;
    }

    dispatch(addToCart({
      productId: product._id,
      variantId: selectedVariant._id,
      quantity,
    }));
    
    dispatch(showToast({ type: 'success', message: 'Added to cart!' }));
  };

  const sizes = [...new Set(variants?.map(v => v.size).filter(Boolean))];
  const colors = [...new Set(variants?.map(v => v.color).filter(Boolean))];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link to="/" className="text-gray-500 hover:text-primary-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="text-gray-500 hover:text-primary-600">Products</Link>
          {category && (
            <>
              <span className="mx-2">/</span>
              <Link to={`/products?category=${category.slug}`} className="text-gray-500 hover:text-primary-600">
                {category.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-900">{name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div>
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img
                src={images?.[selectedImage]?.url || '/placeholder.jpg'}
                alt={name}
                className="w-full h-full object-contain"
              />
              {discount > 0 && (
                <Badge variant="error" className="absolute top-4 left-4">-{discount}%</Badge>
              )}
            </div>
            
            {images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx ? 'border-primary-600' : 'border-transparent'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{name}</h1>
            
            {/* Rating */}
            {rating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {rating.toFixed(1)} ({numReviews} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(price)}</span>
              {comparePrice > price && (
                <span className="text-xl text-gray-400 line-through">{formatPrice(comparePrice)}</span>
              )}
            </div>

            {/* Stock */}
            <div className="mb-6">
              <StockBadge quantity={totalStock} threshold={5} />
            </div>

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const variant = variants.find(v => v.size === size && v.color === selectedVariant?.color);
                    const isAvailable = variant?.stock > 0;
                    return (
                      <button
                        key={size}
                        onClick={() => {
                          const v = variants.find(v => v.size === size && v.color === selectedVariant?.color);
                          if (v) setSelectedVariant(v);
                        }}
                        disabled={!isAvailable}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                          selectedVariant?.size === size
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : isAvailable
                              ? 'border-gray-300 hover:border-primary-600'
                              : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => {
                    const variant = variants.find(v => v.color === color && v.size === selectedVariant?.size);
                    const isAvailable = variant?.stock > 0;
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          const v = variants.find(v => v.color === color && v.size === selectedVariant?.size);
                          if (v) setSelectedVariant(v);
                        }}
                        disabled={!isAvailable}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                          selectedVariant?.color === color
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : isAvailable
                              ? 'border-gray-300 hover:border-primary-600'
                              : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center border border-gray-200 rounded-lg w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:text-primary-600"
                >
                  -
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min((selectedVariant?.stock || 10), quantity + 1))}
                  className="px-4 py-2 text-gray-600 hover:text-primary-600"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <Button
                size="lg"
                fullWidth
                onClick={handleAddToCart}
                disabled={totalStock === 0 || !selectedVariant}
              >
                {totalStock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button size="lg" variant="outline">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Button>
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{description}</p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Customer Reviews</h2>
            {user && (
              <Button onClick={() => setShowReviewModal(true)}>Write a Review</Button>
            )}
          </div>

          {reviews?.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.slice(0, 4).map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
          )}
        </section>

        {/* Related Products */}
        {relatedProducts?.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
