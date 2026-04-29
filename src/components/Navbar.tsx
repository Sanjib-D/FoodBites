import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, LogOut, User, UtensilsCrossed, MapPin, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { AddressModal } from './AddressModal';

interface NavbarProps {
  onOpenCart: () => void;
}

export function Navbar({ onOpenCart }: NavbarProps) {
  const { items } = useCart();
  const { customer, logout } = useAuth();
  const navigate = useNavigate();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [imgError, setImgError] = useState(false);
  const [isAddressModalOpen, setAddressModalOpen] = useState(false);

  React.useEffect(() => {
    const handleOpenModal = () => setAddressModalOpen(true);
    document.addEventListener('open-address-modal', handleOpenModal);
    return () => document.removeEventListener('open-address-modal', handleOpenModal);
  }, []);

  // Extract a brief version of the main address to show
  let displayAddress = 'Select Location';
  if (customer && customer.addresses && customer.addresses.length > 0) {
    const primaryAddr = customer.addresses[0];
    const addrStr = typeof primaryAddr === 'object' ? primaryAddr.formatted : primaryAddr;
    if (addrStr) {
      displayAddress = addrStr.substring(0, 24) + (addrStr.length > 24 ? '...' : '');
    }
  } else if (customer && customer.address) {
    displayAddress = customer.address.substring(0, 24) + (customer.address.length > 24 ? '...' : '');
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
    <nav className="sticky top-0 z-40 w-full bg-slate-900 border-b border-slate-800 shadow-sm text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-6">
            <Link to="/" onClick={() => {
              if (window.location.pathname === '/') {
                window.dispatchEvent(new Event('clear-search'));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }} className="flex items-center gap-3 group">
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
              <span className="font-sans font-bold text-xl text-white tracking-tight hidden sm:block">
                Food Bites
              </span>
            </Link>
            
            {/* Address Selector */}
            <button 
              onClick={() => setAddressModalOpen(true)}
              className="hidden md:flex flex-col items-start hover:text-white transition-colors cursor-pointer border-l border-slate-700 pl-6 ml-2"
            >
              <div className="flex items-center gap-1.5 text-slate-400 font-medium text-xs mb-0.5 uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5 text-brand-500" /> Deliver to
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <span className="font-semibold truncate max-w-[180px] lg:max-w-[240px]">{displayAddress}</span>
                <ChevronDown className="w-4 h-4 text-brand-500" />
              </div>
            </button>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            {customer ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-2 hover:text-brand-500 transition-colors">
                  {customer.avatar ? (
                    <img src={customer.avatar} alt="Profile" className="w-7 h-7 rounded-full bg-slate-800 object-cover border border-slate-700" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium text-slate-200 hover:text-white transition-colors">{customer.name}</span>
                </Link>
                <Link to="/orders" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Orders
                </Link>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors flex items-center justify-center p-1" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-all">
                 Login / Sign up
              </Link>
            )}
            
            <button 
              onClick={onOpenCart}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold text-sm transition-colors relative shadow-sm"
            >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                {itemCount}
              </span>
            )}
          </button>
          </div>
        </div>
        
        {/* Mobile address showing under navbar */}
        <button 
          onClick={() => setAddressModalOpen(true)}
          className="md:hidden flex items-center justify-between w-full py-3 border-t border-slate-800 text-sm text-slate-300"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deliver to:</span>
            <span className="font-medium truncate max-w-[150px]">{displayAddress}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </nav>
    <AddressModal isOpen={isAddressModalOpen} onClose={() => setAddressModalOpen(false)} />
    </>
  );
}
