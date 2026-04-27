import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ScrollToTop } from './components/ScrollToTop';

import { CustomerLayout } from './CustomerLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SuperAdminLogin } from './pages/superadmin/SuperAdminLogin';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <CartProvider>
        <Routes>
          {/* Super Admin Dashboard */}
          <Route path="/superadmin/login" element={<SuperAdminLogin />} />
          <Route path="/superadmin/dashboard/*" element={<SuperAdminDashboard />} />
          <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" />} />

          {/* Admin Dashboard - separate layout without typical footer/header */}
          <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />

          {/* Customer Routes (Including Admin Login to preserve header/footer) */}
          <Route path="/*" element={<CustomerLayout />} />
        </Routes>
      </CartProvider>
    </Router>
  );
}

