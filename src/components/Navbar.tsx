import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, LogOut, User, UtensilsCrossed } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenCart: () => void;
}

export function Navbar({ onOpenCart }: NavbarProps) {
  const { items } = useCart();
  const { customer, logout } = useAuth();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [imgError, setImgError] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full bg-slate-900 border-b border-slate-800 shadow-sm text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3 group">
            {!imgError ? (
              <img 
                src="/logo_white.png" 
                alt="Food Bites" 
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105" 
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold transition-all shadow-md group-hover:scale-105">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
            )}
            <span className="font-sans font-bold text-xl text-white tracking-tight">
              Food Bites
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            {customer ? (
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <button className="text-sm border-r border-slate-200 pr-4 flex items-center gap-2 hover:text-brand-500 transition-colors">
                    {customer.avatar ? (
                      <img src={customer.avatar} alt="Profile" className="w-6 h-6 rounded-full bg-slate-100" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline font-medium">{customer.name}</span>
                  </button>
                  <div className="absolute right-4 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-slate-700 py-2 z-50">
                    <Link to="/profile" className="block px-4 py-2 hover:bg-slate-50 transition-colors text-sm">Profile</Link>
                    <Link to="/addresses" className="block px-4 py-2 hover:bg-slate-50 transition-colors text-sm">Addresses</Link>
                    <Link to="/orders" className="block px-4 py-2 hover:bg-slate-50 transition-colors text-sm">Order History</Link>
                  </div>
                </div>
                <button onClick={logout} className="text-sm opacity-80 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-medium opacity-80 hover:opacity-100 transition-opacity">
                 Login
              </Link>
            )}
            
            <button 
              onClick={onOpenCart}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium text-sm transition-colors relative"
            >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border border-slate-900 shadow-sm">
                {itemCount}
              </span>
            )}
          </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
