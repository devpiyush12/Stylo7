/**
 * STYLO7 E-commerce Backend Server
 * Main entry point for the API
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const inventoryRoutes = require('./routes/inventory');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const couponRoutes = require('./routes/coupons');
const adminRoutes = require('./routes/admin');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import scheduled tasks
const { checkLowStock, sendOrderReminders } = require('./utils/scheduledTasks');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet for security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================
// BODY PARSING
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create default admin if not exists
    const User = require('./models/User');
    const adminExists = await User.findOne({ role: 'superadmin' });
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await User.create({
        name: 'Super Admin',
        email: process.env.ADMIN_EMAIL || 'admin@stylo7.com',
        password: hashedPassword,
        role: 'superadmin',
        isVerified: true
      });
      console.log('✅ Default superadmin created');
    }
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

connectDB();

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);

// Static files for invoices
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// ============================================
// SCHEDULED TASKS (Cron Jobs)
// ============================================

// Check low stock every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('⏰ Running low stock check...');
  await checkLowStock();
});

// Send order delivery reminders every day at 10 AM
cron.schedule('0 10 * * *', async () => {
  console.log('⏰ Sending order reminders...');
  await sendOrderReminders();
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║       STYLO7 Backend Server Started      ║
  ╠══════════════════════════════════════════╣
  ║  Port: ${PORT}                              ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}               ║
  ║  Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}     ║
  ╚══════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;
