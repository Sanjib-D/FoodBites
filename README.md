<div align="center">
  <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop" alt="FoodBites Banner" width="100%" height="300" style="object-fit: cover; border-radius: 12px;"/>

  <h1>🍔 FoodBites</h1>
  <p><strong>A Modern, Full-Stack Food Delivery & Management Platform</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  </p>
</div>

<br />

FoodBites is an end-to-end food delivery marketplace engineered with the MERN stack (MongoDB, Express, React, Node.js). It features a robust multi-tenant architecture that seamlessly bridges hungry customers, restaurant owners, and platform administrators through dedicated, real-time dashboards.

---

## ✨ Key Features

### 🛍️ Customer Experience
- **Interactive Discovery:** Browse approved restaurants, filter by cuisine, and explore menus with dietary tags.
- **Dynamic Cart & Checkout:** Persistent shopping cart that calculates subtotals, applies global/restaurant coupons, and integrates platform service fees dynamically.
- **Live Order Tracking:** State-machine driven order updates tracking lifecycle from `Pending` → `Preparing` → `Out for Delivery` → `Delivered`.
- **Profile Management:** Address book, order history with exact financial receipts, and avatar uploads.

### 🏪 Restaurant Partner Dashboard
- **Live Order Terminal:** Instantly receive and process incoming customer orders to update their live delivery status.
- **Menu Management:** Full CRUD capabilities to add dishes, upload food photography, manage stock availability, and update pricing.
- **Financial Analytics:** Visual revenue charts powered by `recharts` to track daily and monthly sales performance.

### 👑 Superadmin Control Center
- **Restaurant Onboarding:** Review, approve, suspend, or reject incoming restaurant partnership applications.
- **Global Economics:** Adjust platform-wide service fees and delivery base charges dynamically.
- **Promotions Engine:** Generate and invalidate platform-wide discount codes.
- **Job Portal:** Post internal platform careers and review incoming applicant resumes.

---

## 🛠️ Tech Stack

**Client:**
- React 18 (Vite)
- TypeScript for type safety
- Tailwind CSS for responsive, utility-first styling
- Lucide React for consistent iconography
- Recharts for data visualization
- React Router DOM for SPA routing

**Server:**
- Node.js & Express.js
- MongoDB & Mongoose (Object Data Modeling)
- JSON Web Tokens (JWT) for stateless authentication
- BcryptJS for cryptographic password hashing

---

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local instance or MongoDB Atlas URI)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/foodbites.git
   cd foodbites
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add the following keys. *(Note: Do not commit your real `.env` file!)*
   ```env
   # Database connection string
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/foodbites?retryWrites=true&w=majority

   # Secret key for signing JWTs
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

4. **Start the Development Server**
   This command starts the Vite frontend and Express backend concurrently.
   ```bash
   npm run dev
   ```
   *The application will be available at `http://localhost:3000`.*

---

## 📁 Project Structure

```text
foodbites/
├── src/
│   ├── components/    # Reusable UI components (Cart, Layouts, etc.)
│   ├── context/       # React Context (AuthContext, CartContext)
│   ├── hooks/         # Custom React Hooks
│   ├── pages/         # Route-level components split by roles
│   │   ├── admin/         # Restaurant Owner Dashboard views
│   │   ├── superadmin/    # Superadmin Central Panel views
│   │   └── ...            # Public and Customer views
│   ├── types/         # TypeScript Interfaces and Types
│   ├── App.tsx        # Main routing configuration
│   └── main.tsx       # Entry point & Global Fetch Interceptor
├── server.ts          # Express.js Backend & API Routes
├── package.json       # Workspace dependencies & scripts
└── tailwind.config.js # Tailwind theme and styling rules
```

---

## 🔒 Security Summary

- **RBAC (Role-Based Access Control):** Dedicated middleware validates JWTs and specific roles (`customer`, `admin`, `superadmin`) before serving API payloads.
- **Fetch Interceptors:** The frontend globally attaches Bearer tokens to outbound requests seamlessly.
- **Cryptographic Hashing:** Passwords are mathematically salted and hashed using `bcryptjs` before persisting to MongoDB.
- **No Direct Exertion:** Type interfaces and Mongoose constraints explicitly deny prototype pollution or unexpected schema injections.

---

## 🏗️ Building for Production

Compile the TypeScript application into minified, statically servable CSS and JS files:

```bash
npm run build
```

Once built, deploy and run the integrated server:

```bash
npm start
```
*In production mode, Express statically serves the React SPA from the `/dist` directory while actively listening to `/api/*` requests on the same port.*

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 

1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<p align="center">
  <i>Built with ❤️ for modern dining.</i>
</p>
