import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchProducts } from '../store/slices/productsSlice';
import { ProductCard } from '../components/features';
import { PageLoader } from '../components/common/Loader';
import Button from '../components/common/Button';

/**
 * HomePage - Main landing page
 */
const HomePage = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchProducts({ featured: true, limit: 8 }));
  }, [dispatch]);

  const categories = [
    { name: 'Track Pants', image: '/images/cat-trackpants.jpg', path: '/products?category=track-pants' },
    { name: 'Joggers', image: '/images/cat-joggers.jpg', path: '/products?category=joggers' },
    { name: 'Shorts', image: '/images/cat-shorts.jpg', path: '/products?category=shorts' },
    { name: 'Trousers', image: '/images/cat-trousers.jpg', path: '/products?category=trousers' },
  ];

  const features = [
    { icon: '🚚', title: 'Free Shipping', desc: 'On orders above ₹2,499' },
    { icon: '↩️', title: 'Easy Returns', desc: '7-day hassle-free returns' },
    { icon: '💳', title: 'Secure Payment', desc: '100% secure checkout' },
    { icon: '📞', title: '24/7 Support', desc: 'Call us at +91-7974808989' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Premium Men's<br />Bottom Wear
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8">
              Discover our collection of track pants, joggers, shorts, and trousers.
              Quality meets style at STYLO7.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products">
                <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                  Shop Now
                </Button>
              </Link>
              <Link to="/products?featured=true">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  View Featured
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-8 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4">
                <span className="text-3xl">{feature.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Shop by Category</h2>
            <p className="text-gray-500 mt-2">Find your perfect fit</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat, idx) => (
              <Link key={idx} to={cat.path}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="relative rounded-xl overflow-hidden aspect-[3/4] group"
                >
                  <div className="absolute inset-0 bg-gray-200">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-white">{cat.name}</h3>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-500 mt-1">Handpicked for you</p>
            </div>
            <Link to="/products?featured=true">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {loading ? (
            <PageLoader />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products?.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 md:py-16 bg-primary-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Join the STYLO7 Family
          </h2>
          <p className="text-primary-100 mb-6">
            Subscribe to get exclusive offers, new arrivals, and style tips.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Button className="bg-gray-900 hover:bg-gray-800">
              Subscribe
            </Button>
          </form>
        </div>
      </section>

      {/* About */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                About STYLO7
              </h2>
              <p className="text-gray-600 mb-4">
                STYLO7 is a premium men's bottom wear brand based in Indore, India.
                We specialize in high-quality track pants, joggers, shorts, and trousers
                designed for the modern Indian man.
              </p>
              <p className="text-gray-600 mb-6">
                Our commitment to quality, comfort, and style has made us a trusted
                choice for customers across India. Every product is crafted with
                attention to detail and premium materials.
              </p>
              <Link to="/about">
                <Button variant="outline">Learn More</Button>
              </Link>
            </div>
            <div className="bg-gray-200 rounded-2xl aspect-video flex items-center justify-center">
              <img
                src="/images/about.jpg"
                alt="About STYLO7"
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
