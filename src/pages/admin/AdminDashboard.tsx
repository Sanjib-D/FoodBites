import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, BarChart3, Users, Bell, LogOut, X } from 'lucide-react';
import { Link, useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { DashboardOverview } from './DashboardOverview';
import { LiveOrders } from './LiveOrders';
import { AdminOrderHistory } from './AdminOrderHistory';
import { MenuManagement } from './MenuManagement';
import { Analytics } from './Analytics';
import { Customers } from './Customers';
import { RestaurantProfile } from './RestaurantProfile';
import { RestaurantReviews } from './RestaurantReviews';
import { Store, MessageSquare, History } from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('restaurantId');
    navigate('/admin/login');
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/admin/login');
      return;
    }
    let isMounted = true;
    const fetchRest = async () => {
      try {
        const restId = localStorage.getItem('restaurantId') || '1';
        const res = await fetch(`/api/restaurants/${restId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) setRestaurantName(data.name || 'Restaurant Admin');
      } catch (e) {
        if (isMounted) setRestaurantName('Restaurant Admin');
      }
    };
    fetchRest();
    return () => { isMounted = false; };
  }, []);

  const currentPath = location.pathname;

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = currentPath === to;
    return (
      <Link 
        to={to} 
        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
      >
        <Icon className="w-5 h-5 mr-3" />
        {label}
      </Link>
    );
  };

  const [notifications, setNotifications] = useState<any[]>([]);

  const AnimatedRoute = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-full"
    >
      {children}
    </motion.div>
  );

  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch('/api/admin/orders', { headers });
        if (!res.ok) return;
        const data = await res.json();
        
        if (isMounted) {
          const recentOrders = data.slice(0, 5).map((o: any) => ({
            id: o._id,
            text: `Order #${o._id.substring(0,8)} is ${o.status}`,
            time: new Date(o.createdAt).toLocaleTimeString()
          }));
          setNotifications(recentOrders);
        }
      } catch(err) {
        // ignore
      }
    };
    
    fetchNotifications();
    const inv = setInterval(fetchNotifications, 10000);
    return () => {
      isMounted = false;
      clearInterval(inv);
    };
  }, []);

  return (
    <div className="w-full h-screen bg-slate-50 text-slate-900 flex overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full shrink-0">
        <div className="p-6 flex items-center gap-3">
          {!imgError ? (
            <img 
              src="/logo_white.png" 
              alt="Food Bites" 
              className="h-10 w-auto object-contain transition-transform hover:scale-105" 
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">FB</div>
          )}
          <span className="text-xl font-bold text-white tracking-tight">Food Bites</span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/admin/dashboard/orders" icon={ClipboardList} label="Live Orders" />
          <NavItem to="/admin/dashboard/history" icon={History} label="Order History" />
          <NavItem to="/admin/dashboard/menu" icon={UtensilsCrossed} label="Menu Management" />
          <NavItem to="/admin/dashboard/profile" icon={Store} label="Restaurant Profile" />
          <NavItem to="/admin/dashboard/analytics" icon={BarChart3} label="Analytics" />
          <NavItem to="/admin/dashboard/customers" icon={Users} label="Customers" />
          <NavItem to="/admin/dashboard/reviews" icon={MessageSquare} label="Reviews" />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg group cursor-pointer" onClick={handleLogout}>
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white">
                {restaurantName.substring(0, 1).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-xs truncate max-w-[100px]">{restaurantName}</p>
              <p className="opacity-50 text-xs">Admin Panel</p>
            </div>
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-20">
          <h2 className="text-xl font-bold text-slate-800">Management Dashboard</h2>
          <div className="flex items-center gap-4 relative">
            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-2">
              &larr; Back to Website
            </Link>
            <div className="w-px h-6 bg-slate-200"></div>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              {notifications.length > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 border border-white rounded-full"></span>}
              <Bell className="w-5 h-5 text-slate-400" />
            </button>
            
            {showNotifications && (
              <div className="absolute top-full right-24 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-sm text-slate-800 font-medium mb-1">{n.text}</p>
                      <p className="text-xs text-slate-500">{n.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-100 text-center">
                  <button className="text-sm text-brand-500 font-medium hover:text-brand-600">Mark all as read</button>
                </div>
              </div>
            )}

            <Link to="/admin/dashboard/menu" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 transition-colors text-white rounded-lg font-medium text-sm inline-flex">
              Add New Menu Item
            </Link>
          </div>
        </header>

        {/* Content View */}
        <div className="p-8 flex-1 overflow-y-auto bg-slate-50 relative z-10">
          <div className={currentPath === '/admin/dashboard' || currentPath === '/admin/dashboard/' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
            <DashboardOverview />
          </div>
          <div className={currentPath === '/admin/dashboard/orders' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
            <LiveOrders />
          </div>
          <div className={currentPath === '/admin/dashboard/history' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
            <AdminOrderHistory />
          </div>
          <div className={currentPath === '/admin/dashboard/menu' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
            <MenuManagement />
          </div>
          <div className={currentPath === '/admin/dashboard/profile' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
            <RestaurantProfile />
          </div>
          <div className={currentPath === '/admin/dashboard/analytics' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
            <Analytics />
          </div>
          <div className={currentPath === '/admin/dashboard/customers' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
            <Customers />
          </div>
          <div className={currentPath === '/admin/dashboard/reviews' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
            <RestaurantReviews />
          </div>
        </div>
      </main>
    </div>
  );
}
