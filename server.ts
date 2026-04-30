import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import path from "path";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "food-bites-super-secret-key-123";

// Middleware to authenticate JWT
export const authenticate = (roles: string[] = [], optional: boolean = false) => {
  return (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader === "Bearer null") {
      if (optional) {
        req.user = null;
        return next();
      }
      return res.status(401).json({ error: "No authorization header provided" });
    }
    
    const token = authHeader.split(" ")[1];
    if (!token || token === "null") {
      if (optional) {
        req.user = null;
        return next();
      }
      return res.status(401).json({ error: "No token provided" });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        if (optional) {
           req.user = null;
           return next();
        }
        return res.status(403).json({ error: "Unauthorized access" });
      }
      req.user = decoded;
      next();
    } catch (err) {
      if (optional) {
        req.user = null;
        return next();
      }
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
};

// Remove invalid CLOUDINARY_URL if user provided one
if (process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_URL.startsWith('cloudinary://')) {
  console.warn("Invalid CLOUDINARY_URL protocol, ignoring it.");
  delete process.env.CLOUDINARY_URL;
}

export async function deleteFromCloudinary(url: string) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return;
  
  try {
    const parts = url.split('/upload/');
    if (parts.length !== 2) return;
    
    const afterUpload = parts[1];
    const parts2 = afterUpload.split('/');
    if (parts2[0].startsWith('v') && !isNaN(parseInt(parts2[0].substring(1)))) {
      parts2.shift();
    }
    const publicIdWithExt = parts2.join('/');
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    const publicId = lastDotIndex !== -1 ? publicIdWithExt.substring(0, lastDotIndex) : publicIdWithExt;
    
    if (publicId) {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
         return; // Silently fail since we just want to delete
      }
      const cloudinary = (await import('cloudinary')).v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted old image from Cloudinary: ${publicId}`);
    }
  } catch (err) {
    console.error('Failed to delete old image from Cloudinary:', err);
  }
}

// Helper to upload base64 images to Cloudinary
async function processImagePayload(body: any, fieldName: string) {
  if (body && typeof body[fieldName] === 'string' && body[fieldName].startsWith('data:image')) {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
       console.error('Cloudinary credentials missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
       throw new Error('Cloudinary credentials missing in environment.');
    }

    try {
      const cloudinary = (await import('cloudinary')).v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      
      const result = await cloudinary.uploader.upload(body[fieldName], {
        resource_type: 'image',
      });
      body[fieldName] = result.secure_url;
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      throw new Error(`Image upload failed: ${err.message || 'Unknown error'}`);
    }
  }
}

// Mock Data fallbacks if MongoDB is not provided or connected
const mockRestaurants = [
  {
    _id: "1",
    name: "Burger Haven",
    cuisine: "American",
    rating: 4.8,
    deliveryTime: "25-35 min",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    tags: ["Burgers", "Fast Food", "American"],
    status: "approved",
    mapsUrl: "https://maps.google.com/?q=Burger+Haven+City",
    address: "123 Burger St, Food City",
    createdAt: new Date("2026-01-15T12:00:00Z").toISOString(),
  },
  {
    _id: "2",
    name: "Slice of Italy",
    cuisine: "Italian",
    rating: 4.6,
    deliveryTime: "30-45 min",
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=800",
    tags: ["Pizza", "Pasta", "Italian"],
    status: "approved"
  },
  {
    _id: "3",
    name: "Green Bowl",
    cuisine: "Healthy",
    rating: 4.9,
    deliveryTime: "15-25 min",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
    tags: ["Salads", "Healthy", "Vegan"],
    status: "pending",
    email: "admin3@example.com",
    password: "password123"
  }
];

let mockMenus: Record<string, any[]> = {
  "1": [
    { _id: "m1", restaurantId: "1", name: "Classic Cheeseburger", description: "Beef patty, cheddar, lettuce, tomato, house sauce", price: 12.99, category: "Mains" },
    { _id: "m2", restaurantId: "1", name: "Crispy Fries", description: "Golden shoestring fries with sea salt", price: 4.99, category: "Sides" },
    { _id: "m3", restaurantId: "1", name: "Vanilla Shake", description: "Old-fashioned vanilla bean milkshake", price: 5.99, category: "Drinks" }
  ],
  "2": [
    { _id: "m4", restaurantId: "2", name: "Margherita Pizza", description: "San Marzano tomatoes, fresh mozzarella, basil", price: 16.99, category: "Pizza" },
    { _id: "m5", restaurantId: "2", name: "Garlic Bread", description: "Toasted ciabatta with garlic herb butter", price: 6.99, category: "Starters" },
    { _id: "m6", restaurantId: "2", name: "Tiramisu", description: "Classic Italian coffee-flavored dessert", price: 8.99, category: "Desserts" }
  ],
  "3": [
    { _id: "m7", restaurantId: "3", name: "Quinoa Power Bowl", description: "Quinoa, roasted sweet potato, kale, avocado", price: 14.99, category: "Bowls" },
    { _id: "m8", restaurantId: "3", name: "Green Smoothie", description: "Spinach, apple, ginger, lemon, cucumber", price: 7.99, category: "Drinks" }
  ]
};

// In-memory stats for SuperAdmin features
let mockCoupons = [
  { _id: "c1", code: "BITES50", discount: 50, type: "fixed", active: true },
  { _id: "c2", code: "10OFF", discount: 10, type: "percentage", active: true }
];
let mockSettings = { deliveryCharge: 40, platformFee: 25, taxRate: 5, restaurantFeePercent: 5, restaurantFeeFixed: 10 };

// In-memory orders for demonstration
let mockOrders: any[] = [];
let mockCustomers: any[] = [];

// Mongoose Models (if real DB is connected)
const restaurantSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: String,
  cuisine: String,
  rating: Number,
  deliveryTime: String,
  address: String,
  mapsUrl: String,
  about: String,
  image: String,
  tags: [String],
  status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  email: { type: String, unique: true },
  password: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

const menuSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  restaurantId: String,
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String
});
const MenuItem = mongoose.model('MenuItem', menuSchema);

const orderSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  items: Array,
  total: Number,
  subtotal: Number,
  deliveryCharge: Number,
  platformFee: Number,
  restaurantPlatformFee: { type: Number, default: 0 },
  discount: Number,
  tax: Number,
  status: { type: String, default: 'Pending' },
  customerInfo: Object,
  customerId: String,
  restaurantId: String,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

const customerSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: String,
  email: { type: String, unique: true },
  password: String, // In a real app, hash this!
  phone: String,
  address: String,
  addresses: [mongoose.Schema.Types.Mixed],
  avatar: String,
  gender: String
});
const Customer = mongoose.model('Customer', customerSchema);

const reviewSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  restaurantId: String,
  customerId: String,
  customerName: String,
  orderId: String,
  rating: Number,
  comment: String,
  isFlagged: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Review = mongoose.model('Review', reviewSchema);

let mockReviews: any[] = [
  { _id: "r1", restaurantId: "1", customerName: "Alice S.", orderId: "ord_1", rating: 5, comment: "Best burgers in town!", isFlagged: false, createdAt: new Date() }
];

const jobApplicationSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  jobId: Number,
  jobTitle: String,
  name: String,
  email: String,
  phone: String,
  currentRole: String,
  experience: String,
  qualification: String,
  createdAt: { type: Date, default: Date.now }
});
const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

let mockApplications: any[] = [];

const jobSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  title: String,
  type: String,
  location: String,
  createdAt: { type: Date, default: Date.now }
});
const Job = mongoose.model('Job', jobSchema);

let mockJobs: any[] = [
  { _id: "1", title: 'Senior Frontend Engineer', type: 'Full-time', location: 'Guwahati / Remote', createdAt: new Date() },
  { _id: "2", title: 'Delivery Fleet Manager', type: 'Full-time', location: 'Guwahati, Assam', createdAt: new Date() },
  { _id: "3", title: 'Customer Support Executive', type: 'Full-time', location: 'Remote', createdAt: new Date() },
  { _id: "4", title: 'Marketing Specialist', type: 'Contract', location: 'Guwahati, Assam', createdAt: new Date() }
];

// Super Admin Models
const superAdminSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  email: { type: String, unique: true },
  password: String
});
const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);

const couponSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  code: { type: String, unique: true },
  discount: Number,
  maxDiscount: Number, // For percentage discount
  type: { type: String, enum: ['fixed', 'percentage'] },
  active: { type: Boolean, default: true }
});
const Coupon = mongoose.model('Coupon', couponSchema);

const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  deliveryCharge: { type: Number, default: 40 },
  platformFee: { type: Number, default: 25 }, // Paid by Customer
  taxRate: { type: Number, default: 5 },
  restaurantFeePercent: { type: Number, default: 5 }, // Paid by Restaurant
  restaurantFeeFixed: { type: Number, default: 10 }   // Paid by Restaurant
});
const Settings = mongoose.model('Settings', settingsSchema);

let isDbConnected = false;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const MONGODB_URI = process.env.MONGODB_URI;

  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB successfully.');
      isDbConnected = true;
      
      // Bootstrap DB with mock restaurants if empty
      const count = await Restaurant.countDocuments();
      if (count === 0) {
        await Restaurant.insertMany(mockRestaurants);
        // Also insert menus
        for (const rId of Object.keys(mockMenus)) {
          await MenuItem.insertMany(mockMenus[rId]);
        }
      }

      // Ensure at least one super admin exists
      const adminCount = await SuperAdmin.countDocuments();
      if (adminCount === 0) {
        await SuperAdmin.create({ email: 'superadmin@foodbites.com', password: 'superadmin123' });
      }

      const settingsCount = await Settings.countDocuments();
      if (settingsCount === 0) {
        await Settings.create(mockSettings);
      }
      
      const couponCount = await Coupon.countDocuments();
      if (couponCount === 0) {
        await Coupon.insertMany(mockCoupons);
      }

    } catch (error) {
      console.error('MongoDB connection error, falling back to mock data:', error);
    }
  } else {
    console.log('No MONGODB_URI provided. Running with mock in-memory data.');
  }

  // --- API Routes ---

  // Applications Routes
  app.post("/api/applications", async (req, res) => {
    if (isDbConnected) {
      try {
        const app = new JobApplication(req.body);
        await app.save();
        return res.json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: "Failed to submit application" });
      }
    }
    const newApp = { _id: "app_" + Date.now(), ...req.body, createdAt: new Date() };
    mockApplications.push(newApp);
    res.json({ success: true });
  });

  app.get("/api/superadmin/applications", authenticate(['superadmin']), async (req: any, res: any) => {
    if (isDbConnected) {
      try {
        const apps = await JobApplication.find().sort({ createdAt: -1 });
        return res.json(apps);
      } catch (err) { }
    }
    res.json([...mockApplications].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.delete("/api/superadmin/applications/:id", authenticate(['superadmin']), async (req: any, res: any) => {
    if (isDbConnected) {
      try {
        await JobApplication.findByIdAndDelete(req.params.id);
        return res.json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: "Failed to delete application" });
      }
    }
    mockApplications = mockApplications.filter(a => a._id !== req.params.id);
    res.json({ success: true });
  });

  app.get("/api/jobs", async (req, res) => {
    if (isDbConnected) {
      try {
        const jobs = await Job.find().sort({ createdAt: -1 });
        return res.json(jobs);
      } catch (err) { }
    }
    res.json([...mockJobs].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.post("/api/superadmin/jobs", authenticate(['superadmin']), async (req: any, res: any) => {
    if (isDbConnected) {
      try {
        const job = new Job(req.body);
        await job.save();
        return res.json({ success: true, job });
      } catch (err) {
        return res.status(500).json({ error: "Failed to post job" });
      }
    }
    const newJob = { _id: "job_" + Date.now(), ...req.body, createdAt: new Date() };
    mockJobs.push(newJob);
    res.json({ success: true, job: newJob });
  });

  app.delete("/api/superadmin/jobs/:id", authenticate(['superadmin']), async (req: any, res: any) => {
    if (isDbConnected) {
      try {
        await Job.findByIdAndDelete(req.params.id);
        return res.json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: "Failed to delete job" });
      }
    }
    mockJobs = mockJobs.filter(j => j._id !== req.params.id);
    res.json({ success: true });
  });

  // Search Route
  app.get("/api/search", async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : "";
    const lowerQ = q.toLowerCase();
    
    let matchedRestaurants = [];
    let matchedItems = [];

    if (isDbConnected) {
      try {
        matchedRestaurants = await Restaurant.find({ 
          status: 'approved',
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { cuisine: { $regex: q, $options: 'i' } },
            { tags: { $regex: q, $options: 'i' } }
          ]
        });
        matchedItems = await MenuItem.find({
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
          ]
        });
      } catch (err) { }
    } else {
      matchedRestaurants = mockRestaurants.filter(r => 
        r.status === 'approved' && 
        ((r.name || '').toLowerCase().includes(lowerQ) || 
         (r.cuisine || '').toLowerCase().includes(lowerQ) || 
         (r.tags || []).some((t: string) => t.toLowerCase().includes(lowerQ)))
      );
      
      const allItems = Object.values(mockMenus).flat();
      matchedItems = allItems.filter(i => 
        i.name.toLowerCase().includes(lowerQ) || 
        i.description.toLowerCase().includes(lowerQ)
      );
    }
    
    res.json({ restaurants: matchedRestaurants, items: matchedItems });
  });

  // Reviews Routes
  app.get("/api/restaurants/:id/reviews", async (req, res) => {
    if (isDbConnected) {
      try {
        const reviews = await Review.find({ restaurantId: req.params.id }).sort({ createdAt: -1 });
        return res.json(reviews);
      } catch (err) {}
    }
    const reviews = mockReviews.filter(r => r.restaurantId === req.params.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(reviews);
  });

  app.post("/api/reviews", authenticate(['customer']), async (req: any, res: any) => {
    if (req.user.id !== req.body.customerId) {
        return res.status(403).json({ error: 'Review customerId mismatch' });
    }
    const reviewData = req.body;
    
    // Validate order ownership
    let orderExists = null;
    if (isDbConnected) {
      orderExists = await Order.findById(reviewData.orderId);
    } else {
      orderExists = mockOrders.find(o => o._id === reviewData.orderId);
    }
    
    if (!orderExists) return res.status(404).json({ error: "Order not found" });
    if (String(orderExists.customerId) !== String(req.user.id)) return res.status(403).json({ error: "Order doesn't belong to this customer" });
    
    if (isDbConnected) {
      try {
        // Simple logic to add a review, could check order validation
        const existingReview = await Review.findOne({ orderId: reviewData.orderId });
        if (existingReview) return res.status(400).json({ error: "Already reviewed this order" });
        
        const newReview = new Review(reviewData);
        await newReview.save();
        return res.json({ success: true, review: newReview });
      } catch (err) {
        return res.status(500).json({ error: "Failed to post review" });
      }
    }
    
    const existingReview = mockReviews.find(r => r.orderId === reviewData.orderId);
    if (existingReview) return res.status(400).json({ error: "Already reviewed this order" });
    
    const newReview = { _id: "rev_" + Date.now(), ...reviewData, createdAt: new Date() };
    mockReviews.push(newReview);
    res.json({ success: true, review: newReview });
  });

  app.put("/api/restaurants/:id/reviews/:reviewId/flag", authenticate(['admin', 'superadmin']), async (req: any, res: any) => {
    if (req.user && req.user.role === 'admin' && String(req.user.restaurantId) !== String(req.params.id)) {
      return res.status(403).json({ error: "Unauthorized to flag reviews for this restaurant" });
    }

    if (isDbConnected) {
      try {
        const review = await Review.findByIdAndUpdate(req.params.reviewId, { isFlagged: true }, { new: true });
        return res.json({ success: true, review });
      } catch (err) {
        return res.status(500).json({ error: "Failed to flag review" });
      }
    }
    const idx = mockReviews.findIndex(r => r._id === req.params.reviewId);
    if (idx !== -1) {
      mockReviews[idx].isFlagged = true;
      res.json({ success: true, review: mockReviews[idx] });
    } else {
      res.status(404).json({ error: "Review not found" });
    }
  });

  app.get("/api/superadmin/reviews", authenticate(['superadmin']), async (req: any, res: any) => {
    let filter = {};
    if (req.query.restaurantId) {
      filter = { restaurantId: String(req.query.restaurantId) };
    }
    if (isDbConnected) {
      try {
        const reviews = await Review.find(filter).sort({ createdAt: -1 });
        return res.json(reviews);
      } catch (err) {
        return res.status(500).json({ error: "Failed to fetch reviews" });
      }
    }
    let filteredMock = mockReviews;
    if (req.query.restaurantId) {
      filteredMock = filteredMock.filter(r => String(r.restaurantId) === String(req.query.restaurantId));
    }
    res.json([...filteredMock].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.delete("/api/superadmin/reviews/:id", authenticate(['superadmin']), async (req: any, res: any) => {
    if (isDbConnected) {
      try {
        await Review.findByIdAndDelete(req.params.id);
        return res.json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: "Failed to delete review" });
      }
    }
    mockReviews = mockReviews.filter(r => r._id !== req.params.id);
    res.json({ success: true });
  });

  // Auth Routes
  app.post('/api/auth/admin/register', async (req, res) => {
    try {
      const payload = { ...req.body };
      delete payload.status;
      delete payload.rating;
      delete payload._id;
      
      if (payload.email && typeof payload.email === 'string') {
        payload.email = payload.email.toLowerCase();
      } else {
        return res.status(400).json({ error: 'Valid email is required' });
      }

      if (isDbConnected) {
        // Basic check
        const existing = await Restaurant.findOne({ email: payload.email });
        if (existing) {
          return res.status(400).json({ error: 'Email already in use' });
        }
        const newRestaurant = new Restaurant(payload);
        await newRestaurant.save();
        const token = jwt.sign({ id: newRestaurant._id, role: "admin", restaurantId: newRestaurant._id }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token, restaurantId: newRestaurant._id });
      } else {
        const existing = mockRestaurants.find(r => (r.email || '').toLowerCase() === payload.email);
        if (existing) {
          return res.status(400).json({ error: 'Email already in use' });
        }
        const newRest = { _id: "rest_" + Date.now(), status: "pending", createdAt: new Date(), updatedAt: new Date(), ...payload };
        mockRestaurants.push(newRest);
        const token = jwt.sign({ id: newRest._id, role: "admin", restaurantId: newRest._id }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token, restaurantId: newRest._id });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/admin/login', async (req, res) => {
    let { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(401).json({ error: 'Invalid credentials format' });
    }
    try {
      if (isDbConnected) {
        const restaurant = await Restaurant.findOne({ 
          email: { $regex: new RegExp(`^${(email || '').replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i') }, 
          password 
        });
        if (restaurant) {
          const token = jwt.sign({ id: restaurant._id, role: "admin", restaurantId: restaurant._id }, JWT_SECRET, { expiresIn: '1d' });
          return res.json({ success: true, token, restaurantId: restaurant._id }); 
        }
      } else {
        const restaurant = mockRestaurants.find(r => (r.email || '').toLowerCase() === (email || '').toLowerCase() && r.password === password);
        if (restaurant) {
          const token = jwt.sign({ id: restaurant._id, role: "admin", restaurantId: restaurant._id }, JWT_SECRET, { expiresIn: '1d' });
          return res.json({ success: true, token, restaurantId: restaurant._id });
        }
        // Fallback for mock data that doesn't have email/password initialized
        if (email === 'admin@foodbites.com' && password === 'admin123') {
           const token = jwt.sign({ id: "1", role: "admin", restaurantId: "1" }, JWT_SECRET, { expiresIn: '1d' });
           return res.json({ success: true, token, restaurantId: "1" });
        }
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    } catch (error) {
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  // Super Admin Login Route - Server-side only check
  app.post('/api/superadmin/login', async (req, res) => {
    let { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(401).json({ error: 'Invalid credentials format' });
    }
    if (isDbConnected) {
      const admin = await SuperAdmin.findOne({ email, password });
      if (admin) {
        const token = jwt.sign({ id: admin._id, role: "superadmin" }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({ success: true, token });
      }
      return res.status(401).json({ error: 'Invalid super admin credentials' });
    } else {
      // Fallback for mock environment
      if (email === 'superadmin@foodbites.com' && password === 'superadmin123') {
        const token = jwt.sign({ id: "superadmin", role: "superadmin" }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({ success: true, token });
      }
      return res.status(401).json({ error: 'Invalid super admin credentials' });
    }
  });

  app.post('/api/customers/register', async (req, res) => {
    try {
      const payload = { ...req.body };
      if (payload.email && typeof payload.email === 'string') {
        payload.email = payload.email.toLowerCase();
      } else {
        return res.status(400).json({ error: 'Valid email is required' });
      }
      
      // Initialize addresses array with the provided address
      if (payload.address) {
        payload.addresses = [payload.address];
      }

      if (isDbConnected) {
        const newCustomer = new Customer(payload);
        await newCustomer.save();
        const token = jwt.sign({ id: newCustomer._id, role: "customer" }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, customer: newCustomer, token });
      } else {
        const newCust = { _id: "cust_" + Date.now(), ...payload };
        mockCustomers.push(newCust);
        const token = jwt.sign({ id: newCust._id, role: "customer" }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, customer: newCust, token });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/customers/login', async (req, res) => {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(401).json({ error: 'Invalid format' });
    }
    try {
      if (isDbConnected) {
        const customer = await Customer.findOne({ 
          email: { $regex: new RegExp(`^${(email || '').replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i') }, 
          password 
        });
        if (customer) {
          const token = jwt.sign({ id: customer._id, role: "customer" }, JWT_SECRET, { expiresIn: '7d' });
          return res.json({ success: true, customer, token });
        }
      } else {
        const customer = mockCustomers.find(c => (c.email || '').toLowerCase() === (email || '').toLowerCase() && c.password === password);
        if (customer) {
          const token = jwt.sign({ id: customer._id, role: "customer" }, JWT_SECRET, { expiresIn: '7d' });
          return res.json({ success: true, customer, token });
        }
      }
      res.status(401).json({ error: 'Invalid email or password' });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Protect superadmin routes
  app.use('/api/superadmin', (req, res, next) => {
    if (req.path === '/login') return next();
    if (req.path === '/settings' && req.method === 'GET') return next();
    return authenticate(['superadmin'])(req, res, next);
  });

  // Protect admin routes
  app.use('/api/admin', authenticate(['admin', 'superadmin']));

  app.put('/api/customers/:id', authenticate(['customer', 'superadmin']), async (req: any, res: any) => {
    if (req.user.role !== 'superadmin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Unauthorized to edit this user' });
    }
    try {
      const curId = req.params.id;
      if (req.body.avatar && req.body.avatar.startsWith('data:image')) {
        if (isDbConnected) {
          const oldCustomer = await Customer.findById(curId);
          if (oldCustomer && oldCustomer.avatar) await deleteFromCloudinary(oldCustomer.avatar);
        } else {
          const oldCustomer = mockCustomers.find(c => c._id === curId);
          if (oldCustomer && oldCustomer.avatar) await deleteFromCloudinary(oldCustomer.avatar);
        }
      }
      await processImagePayload(req.body, 'avatar');
      const { name, phone, address, addresses, avatar, gender } = req.body;
      if (isDbConnected) {
        const customer = await Customer.findByIdAndUpdate(curId, { name, phone, address, addresses, avatar, gender }, { new: true });
        if (customer) return res.json({ success: true, customer });
      } else {
        const customerIndex = mockCustomers.findIndex(c => c._id === curId);
        if (customerIndex > -1) {
          mockCustomers[customerIndex] = { ...mockCustomers[customerIndex], name, phone, address, addresses, avatar, gender };
          return res.json({ success: true, customer: mockCustomers[customerIndex] });
        }
      }
      res.status(404).json({ error: 'Customer not found' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Server error' });
    }
  });

  app.get('/api/customers/:id/orders', authenticate(['customer', 'admin', 'superadmin']), async (req: any, res: any) => {
    if (req.user.role === 'customer' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Unauthorized to view these orders' });
    }
    try {
      if (isDbConnected) {
        const orders = await Order.find({ "customerId": req.params.id }).sort({ createdAt: -1 }).populate('restaurantId') || [];
        return res.json(orders);
      }
      res.json([]);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get all restaurants for superadmin
  app.get("/api/restaurants/all", async (req, res) => {
    let restaurants = [];
    if (isDbConnected) {
      try {
        restaurants = await Restaurant.find();
        if (restaurants.length === 0) restaurants = mockRestaurants;
      } catch (err) {
        return res.status(500).json({ error: "Database error" });
      }
    } else {
      restaurants = mockRestaurants;
    }
    res.json(restaurants);
  });

  // Get approved restaurants (for customers)
  app.get("/api/restaurants", async (req, res) => {
    let approved: any[] = [];
    if (isDbConnected) {
      try {
        approved = await Restaurant.find({ status: 'approved' });
        if (approved.length === 0) approved = mockRestaurants.filter(r => r.status === 'approved');
      } catch (err) {
         return res.status(500).json({ error: "Database error" });
      }
    } else {
      approved = mockRestaurants.filter(r => r.status === 'approved');
    }

    // Append dynamic ratings
    const restaurantsWithRatings = await Promise.all(approved.map(async (r: any) => {
      let rObj = r.toObject ? r.toObject() : { ...r };
      let revs = [];
      if (isDbConnected) revs = await Review.find({ restaurantId: rObj._id });
      else revs = mockReviews.filter(rev => rev.restaurantId === rObj._id);
      
      if (revs.length > 0) {
        rObj.ratingStr = (revs.reduce((acc: number, rev: any) => acc + (rev.rating || 0), 0) / revs.length).toFixed(1);
      } else {
        rObj.ratingStr = "Yet to get Review";
      }
      return rObj;
    }));

    res.json(restaurantsWithRatings);
  });

  // Get restaurant by ID
  app.get("/api/restaurants/:id", async (req, res) => {
    let restaurant: any = null;
    if (isDbConnected) {
      try {
        restaurant = await Restaurant.findById(req.params.id);
      } catch (err) {}
    }
    if (!restaurant) {
      restaurant = mockRestaurants.find(r => r._id === req.params.id);
    }
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    let rObj = restaurant.toObject ? restaurant.toObject() : { ...restaurant };
    let revs = [];
    if (isDbConnected) revs = await Review.find({ restaurantId: rObj._id });
    else revs = mockReviews.filter(rev => rev.restaurantId === rObj._id);
    
    if (revs.length > 0) {
      rObj.ratingStr = (revs.reduce((acc: number, rev: any) => acc + (rev.rating || 0), 0) / revs.length).toFixed(1);
    } else {
      rObj.ratingStr = "Yet to get Review";
    }

    res.json(rObj);
  });

  // Update restaurant status (SuperAdmin)
  app.patch("/api/superadmin/restaurants/:id/status", async (req, res) => {
    const { status } = req.body;
    if (isDbConnected) {
      try {
        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, { status }, { new: true });
        return res.json({ success: true, restaurant });
      } catch (err) {
        return res.status(500).json({ error: "Failed to update restaurant status" });
      }
    }
    const restaurant = mockRestaurants.find(r => r._id === req.params.id);
    if (restaurant) {
      restaurant.status = status;
      return res.json({ success: true, restaurant });
    }
    res.status(404).json({ error: "Restaurant not found" });
  });

  // SuperAdmin Options (Settings & Coupons)
  app.get("/api/superadmin/settings", async (req, res) => {
    if (isDbConnected) {
      const settings = await Settings.findOne();
      return res.json(settings || mockSettings);
    }
    res.json(mockSettings);
  });

  app.put("/api/superadmin/settings", async (req, res) => {
    if (isDbConnected) {
      let settings = await Settings.findOne();
      if (settings) {
        settings.deliveryCharge = req.body.deliveryCharge;
        settings.platformFee = req.body.platformFee;
        settings.restaurantFeePercent = req.body.restaurantFeePercent;
        settings.restaurantFeeFixed = req.body.restaurantFeeFixed;
        await settings.save();
      } else {
        settings = await Settings.create(req.body);
      }
      return res.json({ success: true, settings });
    }
    mockSettings = { ...mockSettings, ...req.body };
    res.json({ success: true, settings: mockSettings });
  });

  app.get("/api/superadmin/coupons", async (req, res) => {
    if (isDbConnected) {
      const coupons = await Coupon.find();
      return res.json(coupons);
    }
    res.json(mockCoupons);
  });

  app.post("/api/superadmin/coupons", async (req, res) => {
    if (isDbConnected) {
      try {
        const coupon = await Coupon.create(req.body);
        return res.json({ success: true, coupon });
      } catch (error: any) {
        if (error.code === 11000) {
          return res.status(400).json({ error: "Coupon code already exists." });
        }
        return res.status(500).json({ error: "Failed to create coupon." });
      }
    }
    
    // Check if code already exists in mock data
    const exists = mockCoupons.some(c => c.code === req.body.code);
    if (exists) {
      return res.status(400).json({ error: "Coupon code already exists." });
    }
    
    const coupon = { _id: "c_" + Date.now(), active: true, ...req.body };
    mockCoupons.push(coupon);
    res.json({ success: true, coupon });
  });
  
  app.delete("/api/superadmin/coupons/:id", async (req, res) => {
    if (isDbConnected) {
      await Coupon.findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    mockCoupons = mockCoupons.filter(c => c._id !== req.params.id);
    res.json({ success: true });
  });

  app.put("/api/superadmin/coupons/:id", async (req, res) => {
    if (isDbConnected) {
      try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.json({ success: true, coupon });
      } catch (err: any) {
        if (err.code === 11000) {
          return res.status(400).json({ error: "Coupon code must be unique." });
        }
        return res.status(500).json({ error: "Failed to update coupon" });
      }
    }
    
    // Check if code exists and is not the current one
    if (req.body.code) {
      const exists = mockCoupons.some(c => c.code === req.body.code && c._id !== req.params.id);
      if (exists) {
        return res.status(400).json({ error: "Coupon code already exists." });
      }
    }

    const index = mockCoupons.findIndex(c => c._id === req.params.id);
    if (index !== -1) {
      mockCoupons[index] = { ...mockCoupons[index], ...req.body };
      return res.json({ success: true, coupon: mockCoupons[index] });
    }
    res.status(404).json({ error: "Coupon not found" });
  });

  // Validate coupon
  app.post("/api/coupons/validate", async (req, res) => {
    const { code } = req.body;
    if (typeof code !== 'string' || !code.trim()) {
      return res.json({ success: false, error: "Invalid coupon" });
    }
    if (isDbConnected) {
      const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
      if (coupon) return res.json({ success: true, coupon });
      return res.json({ success: false, error: "Invalid coupon" });
    }
    const coupon = mockCoupons.find(c => c.code === code.toUpperCase() && c.active);
    if (coupon) return res.json({ success: true, coupon });
    res.json({ success: false, error: "Invalid coupon" });
  });

  // Get menu for a restaurant
  app.get("/api/restaurants/:id/menu", async (req, res) => {
    if (isDbConnected) {
      try {
        const menu = await MenuItem.find({ restaurantId: req.params.id });
        if (menu.length > 0) return res.json(menu);
      } catch (err) {}
    }
    res.json(mockMenus[req.params.id] || []);
  });

  // Create an order
  app.post("/api/orders", authenticate(['customer'], true), async (req: any, res: any) => {
    if (req.user && req.body.customerId && req.user.id !== req.body.customerId) {
      return res.status(403).json({ error: 'Order customerId mismatch' });
    }
    if (!req.user && req.body.customerId) {
      return res.status(403).json({ error: 'Authentication required for this customer ID' });
    }
    const orderData = req.body;
    
    // Basic assignment of restaurantId from the first item
    const restaurantId = orderData.items[0]?.restaurantId || "1"; 
    
    // Security check: Recalculate totals
    let expectedSubtotal = 0;
    try {
      if (isDbConnected) {
        for (const item of orderData.items) {
          const menuItem = await MenuItem.findById(item._id);
          if (menuItem) expectedSubtotal += menuItem.price * item.quantity;
        }
      } else {
        expectedSubtotal = orderData.subtotal; // In mock, simply trust or recalculate if mockMenu is available
      }
    } catch (e) {
      // Ignore
    }
    
    // Fallback securely calculation for tax etc.
    let taxRate = 5;
    let deliveryCharge = 40;
    let platformFee = 25;
    let restaurantFeePercent = 5;
    let restaurantFeeFixed = 10;
    
    if (isDbConnected) {
       const settings = await Settings.findOne();
       if (settings) {
          taxRate = settings.taxRate || 5;
          deliveryCharge = settings.deliveryCharge || 40;
          platformFee = settings.platformFee || 25;
          restaurantFeePercent = typeof settings.restaurantFeePercent === 'number' ? settings.restaurantFeePercent : 5;
          restaurantFeeFixed = typeof settings.restaurantFeeFixed === 'number' ? settings.restaurantFeeFixed : 10;
       }
    } else {
       taxRate = mockSettings.taxRate || 5;
       deliveryCharge = mockSettings.deliveryCharge || 40;
       platformFee = mockSettings.platformFee || 25;
       restaurantFeePercent = typeof mockSettings.restaurantFeePercent === 'number' ? mockSettings.restaurantFeePercent : 5;
       restaurantFeeFixed = typeof mockSettings.restaurantFeeFixed === 'number' ? mockSettings.restaurantFeeFixed : 10;
    }

    const calculatedTax = Math.max(0, (expectedSubtotal - (orderData.discount || 0)) * (taxRate / 100));
    const expectedRestaurantPlatformFee = (expectedSubtotal * (restaurantFeePercent / 100)) + restaurantFeeFixed;
    const calculatedTotal = expectedSubtotal + deliveryCharge + platformFee + calculatedTax - (orderData.discount || 0);
    
    // We update the orderData with verified numbers
    const finalOrderData = {
      ...orderData,
      status: 'Pending',
      subtotal: expectedSubtotal || orderData.subtotal,
      tax: calculatedTax,
      deliveryCharge,
      platformFee,
      restaurantPlatformFee: expectedRestaurantPlatformFee,
      total: expectedSubtotal ? calculatedTotal : orderData.total,
      restaurantId 
    };

    if (isDbConnected) {
      try {
        const newOrder = new Order(finalOrderData);
        await newOrder.save();
        
        // Save address to customer profile if applicable
        if (req.body.customerId && finalOrderData.customerInfo?.address) {
          try {
             const cust = await Customer.findById(req.body.customerId);
             if (cust) {
                const addrs = cust.addresses || [];
                const addrStr = finalOrderData.customerInfo.address;
                const exists = addrs.find((a: any) => (typeof a === 'object' ? a.formatted : a) === addrStr);
                if (!exists) {
                   cust.addresses = [...addrs, addrStr];
                   // Since we use the single address field on register, maybe update it if not set
                   if (!cust.address) cust.address = addrStr;
                   await cust.save();
                }
             }
          } catch (e) {
             console.error("Failed to update customer addresses", e);
          }
        }
        
        console.log("Order saved successfully:", newOrder._id);
        return res.json({ success: true, order: newOrder });
      } catch (err: any) {
        console.error("Order save error:", err);
        return res.status(500).json({ error: "Failed to place order: " + err.message });
      }
    }
    
    // Update mock customer address if applicable
    if (req.body.customerId && finalOrderData.customerInfo?.address) {
      const mockCust = mockCustomers.find(c => c._id === req.body.customerId);
      if (mockCust) {
        if (!mockCust.addresses) mockCust.addresses = [];
        const addrStr = finalOrderData.customerInfo.address;
        const exists = mockCust.addresses.find((a: any) => (typeof a === 'object' ? a.formatted : a) === addrStr);
        if (!exists) {
          mockCust.addresses.push(addrStr);
          if (!mockCust.address) mockCust.address = addrStr;
        }
      }
    }

    const newOrder = { _id: "ord_" + Math.random().toString(36).substr(2, 9), ...finalOrderData, status: 'Pending', createdAt: new Date() };
    mockOrders.push(newOrder);
    console.log("Mock Order saved successfully:", newOrder._id);
    res.json({ success: true, order: newOrder });
  });

  // Get order by ID (for tracking)
  app.get("/api/orders/:id", authenticate(['customer', 'admin', 'superadmin'], true), async (req: any, res: any) => {
    console.log("Fetching order:", req.params.id);
    let order: any = null;
    if (isDbConnected) {
      try {
        order = await Order.findById(req.params.id);
        console.log("Found in DB:", order ? "yes" : "no");
      } catch (err) {
        console.error("Order fetch error:", err);
      }
    } else {
      order = mockOrders.find(o => o._id === req.params.id);
    }

    if (!order) return res.status(404).json({ error: "Order not found" });

    if (req.user) {
      // Security Check: Customers can only view their own orders if the order matches their ID
      if (req.user.role === 'customer' && order.customerId && order.customerId !== req.user.id) {
         return res.status(403).json({ error: "Forbidden: You cannot view this order" });
      }
      
      // Admin check: Admins can only view orders of their restaurant
      if (req.user.role === 'admin') {
         const adminRestId = req.user.restaurantId || req.user.id;
         if (order.restaurantId !== adminRestId) {
            return res.status(403).json({ error: "Forbidden: Order belongs to another restaurant" });
         }
      }
    } else if (order.customerId) {
       // If guest tries to access an order that belongs to a registered customer, we might block it.
       // But often an order ID is a secret URL. For now, allow or block? Let's just allow it since IDs are random or ObjectIds, acting as capabilities.
    }

    let orderObj = order.toObject ? order.toObject() : { ...order };

    // Check if the order has been reviewed
    if (isDbConnected) {
      try {
        const existingReview = await Review.findOne({ orderId: req.params.id });
        if (existingReview) {
          orderObj.hasReviewed = true;
          orderObj.review = existingReview;
        }
      } catch (e) {}
    } else {
      const existingReview = mockReviews.find(r => r.orderId === req.params.id);
      if (existingReview) {
        orderObj.hasReviewed = true;
        orderObj.review = existingReview;
      }
    }

    res.json(orderObj);
  });

  // Admin Routes
  app.get('/api/db-test', (req, res) => {
    res.json({ connected: isDbConnected, uriSet: !!MONGODB_URI });
  });

  app.get('/api/admin/orders', authenticate(['admin', 'superadmin']), async (req: any, res: any) => {
    let filter: any = {};
    if (req.user?.role === 'admin') {
      filter.restaurantId = req.user.restaurantId || req.user.id;
    } else if (req.query.restaurantId) {
      filter.restaurantId = req.query.restaurantId;
    }
    
    if (isDbConnected) {
      try {
        const orders = await Order.find(filter).sort({ createdAt: -1 });
        return res.json(orders);
      } catch (err) {
        return res.status(500).json({ error: "Database error" });
      }
    }
    
    let orders = mockOrders.slice();
    if (req.user?.role === 'admin') {
      const restId = req.user.restaurantId || req.user.id;
      orders = orders.filter(o => o.restaurantId === restId);
    } else if (req.query.restaurantId) {
      orders = orders.filter(o => String(o.restaurantId) === String(req.query.restaurantId));
    }
    res.json(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.get('/api/admin/menu', authenticate(['admin', 'superadmin']), async (req: any, res: any) => {
    let restId = req.query.restaurantId as string;
    if (req.user?.role === 'admin') {
      restId = req.user.restaurantId || req.user.id;
    } else if (!restId) {
      restId = "1";
    }

    if (isDbConnected) {
      try {
        const items = await MenuItem.find({ restaurantId: restId });
        return res.json(items);
      } catch(err) {
        return res.status(500).json({ error: "Failed to fetch menu" });
      }
    }
    res.json(mockMenus[restId] || []);
  });

  app.get('/api/admin/customers', authenticate(['admin', 'superadmin']), async (req: any, res: any) => {
    let filter: any = {};
    if (req.user?.role === 'admin') {
      filter.restaurantId = req.user.restaurantId || req.user.id;
    }

    if (isDbConnected) {
      try {
        const orders = await Order.find(filter).select('customerId customerInfo -_id');
        const customerIds = [...new Set(orders.map(o => o.customerId).filter(id => id))];
        const emails = [...new Set(orders.map(o => o.customerInfo?.email).filter(e => e))];
        const phones = [...new Set(orders.map(o => o.customerInfo?.phone).filter(p => p))];

        const customers = await Customer.find({
          $or: [
            { _id: { $in: customerIds } },
            { email: { $in: emails } },
            { phone: { $in: phones } }
          ]
        }).sort({ _id: -1 });
        
        return res.json(customers);
      } catch (err) {
        return res.status(500).json({ error: "Database error" });
      }
    }
    
    // In-memory logic
    const orders = mockOrders;
    let relevantOrders = orders;
    if (req.user?.role === 'admin') {
      const restId = req.user.restaurantId || req.user.id;
      relevantOrders = relevantOrders.filter(o => o.restaurantId === restId);
    }
    
    const customerIds = new Set(relevantOrders.map(o => o.customerId).filter(Boolean));
    const emails = new Set(relevantOrders.map(o => o.customerInfo?.email).filter(Boolean));
    
    const filteredCustomers = mockCustomers.filter(c => 
      customerIds.has(c._id) || emails.has(c.email)
    ).reverse();
    
    res.json(filteredCustomers);
  });

  app.patch('/api/admin/orders/:id/status', async (req: any, res: any) => {
    const { status } = req.body;
    let orderOwnerId = null;
    
    if (isDbConnected) {
      try {
        const orderExists = await Order.findById(req.params.id);
        if (!orderExists) return res.status(404).json({ error: "Order not found" });
        orderOwnerId = orderExists.restaurantId;
      } catch (err) {
        return res.status(500).json({ error: "Database error" });
      }
    } else {
      const orderExists = mockOrders.find(o => o._id === req.params.id);
      if (!orderExists) return res.status(404).json({ error: "Order not found" });
      orderOwnerId = orderExists.restaurantId;
    }
    
    if (req.user && req.user.role === 'admin' && String(orderOwnerId) !== String(req.user.restaurantId)) {
      return res.status(403).json({ error: "Unauthorized to update this order" });
    }

    if (isDbConnected) {
      try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        return res.json({ success: true, order });
      } catch (err) {
        return res.status(500).json({ error: "Failed to update order" });
      }
    }
    
    const order = mockOrders.find(o => o._id === req.params.id);
    if (order) {
      order.status = status;
      return res.json({ success: true, order });
    }
    res.status(404).json({ error: "Order not found" });
  });

  app.post('/api/admin/menu', authenticate(['admin', 'superadmin']), async (req: any, res: any) => {
    try {
      await processImagePayload(req.body, 'image');
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
    let itemData = req.body;
    let restId = req.user?.restaurantId || itemData.restaurantId;
    
    if (isDbConnected) {
      try {
        if (!restId) {
           const rest = await Restaurant.findOne();
           restId = rest ? rest._id : null;
        }
        const newItem = new MenuItem({ ...itemData, restaurantId: restId });
        await newItem.save();
        return res.json({ success: true, item: newItem });
      } catch (err) {
         return res.status(500).json({ error: "Failed to add item" });
      }
    }

    restId = restId || "1";
    const newItem = { _id: "m_" + Date.now(), ...itemData, restaurantId: restId };
    if (!mockMenus[restId]) mockMenus[restId] = [];
    mockMenus[restId].push(newItem);
    res.json({ success: true, item: newItem });
  });

  app.put('/api/admin/menu/:id', async (req: any, res: any) => {
    // Basic auth check
    if (req.user && req.user.role === 'admin') {
       let itemExists = null;
       if (isDbConnected) {
         itemExists = await MenuItem.findById(req.params.id);
       } else {
         for (const [rId, items] of Object.entries(mockMenus)) {
           const found = items.find((i:any) => i._id === req.params.id);
           if (found) { itemExists = found; break; }
         }
       }
       if (itemExists && String(itemExists.restaurantId) !== String(req.user.restaurantId)) {
          return res.status(403).json({ error: "Unauthorized to edit this item" });
       }
    }

    if (req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('data:image')) {
      if (isDbConnected) {
        const oldItem = await MenuItem.findById(req.params.id);
        if (oldItem && oldItem.image) await deleteFromCloudinary(oldItem.image);
      } else {
        // Find inside mockMenus
        for (const restId in mockMenus) {
          const item = mockMenus[restId].find(m => m._id === req.params.id);
          if (item && item.image) {
            await deleteFromCloudinary(item.image);
            break;
          }
        }
      }
    }
    
    try {
      await processImagePayload(req.body, 'image');
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
    let itemData = req.body;
    if (isDbConnected) {
      try {
        const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, itemData, { new: true });
        return res.json({ success: true, item: updatedItem });
      } catch (err) {
        return res.status(500).json({ error: "Failed to update item" });
      }
    }

    let foundItem = null;
    for (const restId in mockMenus) {
      const idx = mockMenus[restId].findIndex(m => m._id === req.params.id);
      if (idx !== -1) {
        mockMenus[restId][idx] = { ...mockMenus[restId][idx], ...itemData };
        foundItem = mockMenus[restId][idx];
        break;
      }
    }
    if (foundItem) {
      res.json({ success: true, item: foundItem });
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  });

  app.put('/api/admin/restaurants/:id', async (req: any, res: any) => {
    if (req.user && req.user.role === 'admin' && String(req.user.restaurantId) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Unauthorized to edit this restaurant' });
    }
    
    // Prevent mass assignment of sensitive fields
    delete req.body.status;
    delete req.body.rating;
    
    if (req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('data:image')) {
      if (isDbConnected) {
        const oldRest = await Restaurant.findById(req.params.id);
        if (oldRest && oldRest.image) await deleteFromCloudinary(oldRest.image);
      } else {
        const oldRest = mockRestaurants.find(r => r._id === req.params.id);
        if (oldRest && oldRest.image) await deleteFromCloudinary(oldRest.image);
      }
    }
    
    try {
      await processImagePayload(req.body, 'image');
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
    if (isDbConnected) {
      try {
        const updatedRest = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.json({ success: true, restaurant: updatedRest });
      } catch (err) {
        return res.status(500).json({ error: "Failed to update restaurant profile" });
      }
    }
    const idx = mockRestaurants.findIndex(r => r._id === req.params.id);
    if (idx !== -1) {
      mockRestaurants[idx] = { ...mockRestaurants[idx], ...req.body };
      return res.json({ success: true, restaurant: mockRestaurants[idx] });
    }
    res.status(404).json({ error: "Restaurant not found" });
  });

  app.delete('/api/admin/menu/:id', async (req: any, res: any) => {
    if (req.user && req.user.role === 'admin') {
       let itemExists = null;
       if (isDbConnected) {
         itemExists = await MenuItem.findById(req.params.id);
       } else {
         for (const [rId, items] of Object.entries(mockMenus)) {
           const found = items.find((i:any) => i._id === req.params.id);
           if (found) { itemExists = found; break; }
         }
       }
       if (itemExists && String(itemExists.restaurantId) !== String(req.user.restaurantId)) {
          return res.status(403).json({ error: "Unauthorized to delete this item" });
       }
    }

    if (isDbConnected) {
      try {
        await MenuItem.findByIdAndDelete(req.params.id);
        return res.json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: "Failed to delete item" });
      }
    }
    
    // Mock delete
    for (const key of Object.keys(mockMenus)) {
      mockMenus[key] = mockMenus[key].filter(i => i._id !== req.params.id);
    }
    res.json({ success: true });
  });

  // Get Admin Stats (SuperAdmin also uses this or a broader one)
  app.get('/api/admin/stats', authenticate(['admin', 'superadmin']), async (req: any, res: any) => {
    let filter: any = {};
    if (req.user?.role === 'admin') {
      filter.restaurantId = req.user.restaurantId || req.user.id;
    }
    
    let startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    let endOfMonth = new Date();
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23,59,59,999);

    if (req.query.month) {
      const [yyyy, mm] = req.query.month.split('-');
      if (yyyy && mm) {
        startOfMonth = new Date(parseInt(yyyy), parseInt(mm) - 1, 1);
        endOfMonth = new Date(parseInt(yyyy), parseInt(mm), 0, 23, 59, 59, 999);
      }
    }

    if (req.query.period === 'monthly' || req.query.month) {
      filter.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
    }

    let orders = [];
    if (isDbConnected) {
      orders = await Order.find(filter);
    } else {
      orders = mockOrders;
      if (req.user?.role === 'admin') {
        const restId = req.user.restaurantId || req.user.id;
        orders = orders.filter(o => o.restaurantId === restId);
      }
      if (req.query.period === 'monthly' || req.query.month) {
        orders = orders.filter(o => {
          const d = new Date(o.createdAt || new Date());
          return d >= startOfMonth && d <= endOfMonth;
        });
      }
    }
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const completedOrders = orders.filter(o => o.status === 'Delivered').length;

    const totalSubtotal = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0);
    const totalDeliveryCharge = orders.reduce((sum, order) => sum + (order.deliveryCharge || 0), 0);
    const totalPlatformFee = orders.reduce((sum, order) => sum + (order.platformFee || 0), 0);
    const totalRestaurantPlatformFee = orders.reduce((sum, order) => sum + (order.restaurantPlatformFee || 0), 0);
    const totalDiscount = orders.reduce((sum, order) => sum + (order.discount || 0), 0);
    const totalTax = orders.reduce((sum, order) => sum + (order.tax || 0), 0);

    let restaurantStats: any = {};
    for (const o of orders) {
       const rId = o.restaurantId || "1";
       if (!restaurantStats[rId]) {
           let rName = "Unknown";
           if (isDbConnected) {
              const r = await Restaurant.findById(rId);
              if (r) rName = r.name;
           } else {
              const r = mockRestaurants.find(x => x._id === rId);
              if (r) rName = r.name;
           }
           restaurantStats[rId] = { restaurantId: rId, name: rName, totalOrders: 0, totalSales: 0 };
       }
       restaurantStats[rId].totalOrders++;
       restaurantStats[rId].totalSales += (o.total || 0);
    }
    
    res.json({
      totalRevenue,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalSubtotal,
      totalDeliveryCharge,
      totalPlatformFee,
      totalRestaurantPlatformFee,
      totalDiscount,
      totalTax,
      restaurantStats: Object.values(restaurantStats)
    });
  });

  // --- Vite / Static Serve ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
