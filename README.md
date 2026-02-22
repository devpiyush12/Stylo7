# STYLO7 E-Commerce Platform

A full-stack e-commerce web application for STYLO7 - Men's Bottom Wear Brand from Indore, India.

## 🛍️ About STYLO7

- **Brand**: STYLO7 - Premium Men's Bottom Wear
- **Address**: 448 Sai Paradise Colony, Indore – 452012, MP
- **Contact**: +91-7974808989 | stylo7india@gmail.com
- **Business Rules**:
  - Free shipping on orders ₹2,500+
  - COD charge: ₹29
  - Low stock alert at 5 units

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (recommended: v22)
- MongoDB 6+
- npm or bun

### 1. Clone & Install

```bash
cd /root/.openclaw/workspace-coder/stylo7

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup

Create `backend/.env` file:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/stylo7

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this
REFRESH_SECRET=your-refresh-token-secret-change-this

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=stylo7india@gmail.com
SMTP_PASS=your-app-password

# SMS (MSG91)
MSG91_API_KEY=xxxxx
MSG91_SENDER_ID=STYLO7
MSG91_ROUTE=4

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Start MongoDB

```bash
# Using systemd
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name stylo7-mongo mongo:6
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## 📦 Adding Products - Step by Step Guide

### Option 1: Using Admin Dashboard (Recommended)

1. **Create Admin Account**
   ```bash
   cd backend
   node -e "
   const mongoose = require('mongoose');
   const User = require('./models/User');
   require('dotenv').config();
   
   mongoose.connect(process.env.MONGODB_URI).then(async () => {
     const admin = await User.create({
       name: 'Admin',
       email: 'admin@stylo7.com',
       password: 'Admin@123',
       role: 'admin',
       isEmailVerified: true
     });
     console.log('Admin created:', admin.email);
     process.exit(0);
   });
   "
   ```

2. **Login to Admin**
   - Go to http://localhost:3000/login
   - Email: `admin@stylo7.com`
   - Password: `Admin@123`

3. **Navigate to Products**
   - Click "Admin" in the header
   - Go to "Products" → "Add Product"

4. **Fill Product Details**
   - **Name**: Product title (e.g., "Classic Fit Chinos")
   - **Description**: Detailed product description
   - **Category**: Select from dropdown (create categories first in Admin → Categories)
   - **Price**: MRP in ₹
   - **Sale Price**: Selling price (leave empty if same as MRP)
   - **SKU**: Unique product code (e.g., "STY-CHN-001")

5. **Add Variants** (Size/Color combinations)
   - Click "Add Variant"
   - Select size (S, M, L, XL, XXL)
   - Select color
   - Set stock quantity
   - Upload images for this variant

6. **Add Product Images**
   - Main image (required)
   - Additional gallery images
   - Images can be different per variant

7. **Set Product Features**
   - Featured: Show on homepage
   - Active: Product is live
   - Tags: For searchability

8. **Save & Publish**

### Option 2: Using API Directly

```bash
# First, get admin token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stylo7.com","password":"Admin@123"}' | jq -r '.data.accessToken')

# Create a product
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Classic Fit Chinos",
    "description": "Premium cotton chinos with classic fit. Perfect for casual and semi-formal occasions.",
    "shortDescription": "Premium cotton classic fit chinos",
    "category": "CATEGORY_ID_HERE",
    "price": 1499,
    "salePrice": 1199,
    "sku": "STY-CHN-001",
    "variants": [
      {
        "size": "M",
        "color": "Navy Blue",
        "colorCode": "#1a237e",
        "stock": 50,
        "sku": "STY-CHN-001-M-NV"
      },
      {
        "size": "L",
        "color": "Navy Blue",
        "colorCode": "#1a237e",
        "stock": 45,
        "sku": "STY-CHN-001-L-NV"
      }
    ],
    "images": [
      {
        "url": "https://res.cloudinary.com/demo/image/upload/chinos-navy.jpg",
        "alt": "Navy Blue Chinos",
        "isMain": true
      }
    ],
    "features": [
      "100% Cotton",
      "Machine Washable",
      "Classic Fit"
    ],
    "tags": ["chinos", "casual", "formal", "cotton"],
    "isActive": true,
    "isFeatured": true
  }'
```

### Option 3: Bulk Import via Script

Create `backend/scripts/import-products.js`:

```javascript
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config();

const products = [
  {
    name: 'Classic Fit Chinos',
    description: 'Premium cotton chinos...',
    price: 1499,
    salePrice: 1199,
    // ... more fields
  },
  // Add more products
];

async function importProducts() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  for (const productData of products) {
    const category = await Category.findOne({ name: productData.categoryName });
    if (category) {
      productData.category = category._id;
    }
    await Product.create(productData);
    console.log(`Created: ${productData.name}`);
  }
  
  process.exit(0);
}

importProducts();
```

Run it:
```bash
cd backend
node scripts/import-products.js
```

---

## 📂 Project Structure

```
stylo7/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Auth, login, register
│   │   ├── productController.js  # Product CRUD
│   │   ├── cartController.js     # Cart management
│   │   ├── orderController.js    # Orders
│   │   ├── paymentController.js  # Razorpay
│   │   ├── userController.js     # User profile
│   │   ├── reviewController.js   # Product reviews
│   │   ├── couponController.js   # Discounts
│   │   ├── inventoryController.js # Stock
│   │   └── adminController.js    # Admin functions
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── errorHandler.js       # Error handling
│   │   └── validation.js         # Input validation
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Order.js
│   │   ├── Cart.js
│   │   ├── Review.js
│   │   ├── Coupon.js
│   │   └── InventoryLog.js
│   ├── routes/
│   │   ├── index.js              # Route aggregator
│   │   └── *.js                  # Feature routes
│   ├── utils/
│   │   ├── email.js              # Email templates
│   │   └── invoice.js            # PDF invoices
│   ├── server.js                 # Entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── index.js          # Axios client
    │   ├── components/
    │   │   ├── common/           # Reusable UI
    │   │   ├── layout/           # Header, Footer
    │   │   └── features/         # Product cards, etc.
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   ├── useCart.js
    │   │   ├── useProducts.js
    │   │   ├── useOrders.js
    │   │   └── useUI.js
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Products.jsx
    │   │   ├── ProductDetail.jsx
    │   │   ├── Cart.jsx
    │   │   ├── Checkout.jsx
    │   │   ├── Orders.jsx
    │   │   ├── Profile.jsx
    │   │   ├── admin/             # Admin pages
    │   │   └── auth/              # Login, Register
    │   ├── store/
    │   │   ├── index.js          # Redux store
    │   │   └── slices/           # Auth, Cart, etc.
    │   ├── utils/
    │   │   ├── formatPrice.js
    │   │   ├── formatDate.js
    │   │   └── validators.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🔌 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET | `/api/products` | List products (with filters) |
| GET | `/api/products/:id` | Get product details |
| GET | `/api/products/slug/:slug` | Get product by slug |
| GET | `/api/categories` | List categories |
| GET | `/api/categories/:id` | Get category details |

### Protected Endpoints (Require Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |
| GET | `/api/cart` | Get cart |
| POST | `/api/cart` | Add to cart |
| PUT | `/api/cart/:itemId` | Update cart item |
| DELETE | `/api/cart/:itemId` | Remove from cart |
| POST | `/api/cart/coupon` | Apply coupon |
| DELETE | `/api/cart/coupon` | Remove coupon |
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | Get user orders |
| GET | `/api/orders/:id` | Get order details |
| POST | `/api/orders/:id/cancel` | Cancel order |
| POST | `/api/reviews` | Add review |
| GET | `/api/users/wishlist` | Get wishlist |
| POST | `/api/users/wishlist/:productId` | Add to wishlist |
| DELETE | `/api/users/wishlist/:productId` | Remove from wishlist |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/orders` | List all orders |
| PUT | `/api/admin/orders/:id/status` | Update order status |
| GET | `/api/admin/products` | List all products |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |
| GET | `/api/admin/users` | List users |
| PUT | `/api/admin/users/:id` | Update user |
| GET | `/api/inventory/low-stock` | Low stock products |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Run with coverage
npm run test:coverage
```

---

## 🚀 Deployment

### Production Build

```bash
# Frontend
cd frontend
npm run build
# Output: dist/

# Backend
cd backend
npm start  # NODE_ENV=production
```

### Docker Deployment

```bash
# Build images
docker-compose build

# Run
docker-compose up -d
```

### Environment Checklist

- [ ] MongoDB connection string
- [ ] JWT secrets (generate strong random strings)
- [ ] Razorpay production keys
- [ ] Cloudinary production credentials
- [ ] SMTP credentials for email
- [ ] MSG91 API key for SMS
- [ ] CORS origins configured

---

## 📱 Features

### Customer Features
- ✅ Browse products by category
- ✅ Search and filter products
- ✅ Product detail with variant selection
- ✅ Shopping cart with coupon support
- ✅ Secure checkout with Razorpay
- ✅ COD payment option
- ✅ Order tracking
- ✅ Product reviews and ratings
- ✅ Wishlist
- ✅ Address management
- ✅ Email notifications
- ✅ Order invoices (PDF)

### Admin Features
- ✅ Dashboard with analytics
- ✅ Product management (CRUD)
- ✅ Category management
- ✅ Order management
- ✅ User management
- ✅ Inventory tracking
- ✅ Low stock alerts
- ✅ Coupon management
- ✅ Review moderation

---

## 📞 Support

For issues or questions:
- Email: stylo7india@gmail.com
- Phone: +91-7974808989

---

## 📄 License

Proprietary - STYLO7 © 2026
