import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Restaurant } from './pages/Restaurant';
import { Checkout } from './pages/Checkout';
import { OrderTracker } from './pages/OrderTracker';
import { CustomerLogin } from './pages/CustomerLogin';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AuthProvider } from './context/AuthContext';

import { AboutUs } from './pages/AboutUs';
import { Careers } from './pages/Careers';
import { HelpCenter } from './pages/HelpCenter';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { CustomerProfile } from './pages/CustomerProfile';
import { Addresses } from './pages/Addresses';
import { OrderHistory } from './pages/OrderHistory';

export function CustomerLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener('open-cart', handleOpenCart);
    return () => window.removeEventListener('open-cart', handleOpenCart);
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
        <Navbar onOpenCart={() => setIsCartOpen(true)} />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/restaurant/:id" element={<Restaurant />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderTracker />} />
            <Route path="/profile" element={<CustomerProfile />} />
            <Route path="/addresses" element={<Addresses />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </AuthProvider>
  );
}
