// MongoDB initialization script for STYLO7
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('stylo7');

// Create application user (if needed for separate auth)
db.createUser({
  user: 'stylo7_app',
  pwd: 'stylo7_app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'stylo7'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { sparse: true });
db.products.createIndex({ name: 'text', description: 'text' });
db.products.createIndex({ category: 1 });
db.products.createIndex({ 'variants.sku': 1 }, { sparse: true });
db.orders.createIndex({ user: 1, createdAt: -1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ 'payment.razorpayOrderId': 1 }, { sparse: true });
db.reviews.createIndex({ product: 1, user: 1 }, { unique: true });
db.coupons.createIndex({ code: 1 }, { unique: true });
db.inventorylogs.createIndex({ product: 1, variantSku: 1, createdAt: -1 });

// Insert default categories
db.categories.insertMany([
  {
    name: 'Jeans',
    slug: 'jeans',
    description: 'Premium denim jeans for men',
    image: 'https://res.cloudinary.com/stylo7/image/upload/v1/categories/jeans',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Trousers',
    slug: 'trousers',
    description: 'Formal and casual trousers',
    image: 'https://res.cloudinary.com/stylo7/image/upload/v1/categories/trousers',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Shorts',
    slug: 'shorts',
    description: 'Comfortable shorts for casual wear',
    image: 'https://res.cloudinary.com/stylo7/image/upload/v1/categories/shorts',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Track Pants',
    slug: 'track-pants',
    description: 'Sporty track pants for active lifestyle',
    image: 'https://res.cloudinary.com/stylo7/image/upload/v1/categories/track-pants',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Cargo Pants',
    slug: 'cargo-pants',
    description: 'Rugged cargo pants with multiple pockets',
    image: 'https://res.cloudinary.com/stylo7/image/upload/v1/categories/cargo-pants',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('STYLO7 database initialized successfully!');
