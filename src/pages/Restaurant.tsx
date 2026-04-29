import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Star, Clock, Plus, Minus, ArrowLeft, Filter, User, LogOut, ShoppingBag, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCloudinaryUrl } from '../utils/cloudinary';
import { LoadingScreen } from '../components/Loader';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export function Restaurant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items: cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const { customer, logout } = useAuth();
  
  const { data: restaurant, loading: loadingRest } = useApi<any>(`/api/restaurants/${id}`);
  const { data: menuItems, loading: loadingMenu } = useApi<MenuItem[]>(`/api/restaurants/${id}/menu`);
  const { data: reviews, loading: loadingReviews } = useApi<any[]>(`/api/restaurants/${id}/reviews`);

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [sortOption, setSortOption] = useState<string>('default');
  const [scrolled, setScrolled] = useState(false);

  // Reviews state
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 250);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const averageRating = reviews && reviews.length > 0 
    ? (reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : 'Yet to get Review';

  if (loadingRest || loadingMenu) {
    return <LoadingScreen />;
  }

  if (!restaurant) {
    return <div className="p-8 text-center">Restaurant not found</div>;
  }

  // Get unique categories
  const categories: string[] = ['All', ...Array.from(new Set<string>((menuItems || []).map(item => item.category || 'Mains')))];

  // Apply filters and sort
  const filteredItems = (menuItems || []).filter(item => activeCategory === 'All' || (item.category || 'Mains') === activeCategory);
  
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortOption === 'price_asc') return a.price - b.price;
    if (sortOption === 'price_desc') return b.price - a.price;
    return 0; // Default
  });

  // Group items by category to display them
  const groupedMenu = sortedItems.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const getItemQuantity = (itemId: string) => {
    const item = cartItems.find(i => i._id === itemId);
    return item ? item.quantity : 0;
  };

  const handleDecreaseQuantity = (itemId: string, currentQuantity: number) => {
    if (currentQuantity <= 1) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, currentQuantity - 1);
    }
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    // Smooth scroll offset adjustments if we were grouping them inline, but here we just filter the view.
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 bg-slate-50 min-h-screen relative"
    >
      
      {/* Sticky Shrinking Header */}
      <AnimatePresence>
        {scrolled && (
          <motion.div 
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-50 flex items-center px-4 sm:px-8 border-b border-slate-200"
          >
            <button 
              onClick={() => navigate(-1)}
              className="mr-4 p-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img src={getCloudinaryUrl(restaurant.image, 100, 'low')} alt={restaurant.name} className="w-10 h-10 rounded-full object-cover mr-3 border border-slate-200" />
            <div className="flex-1">
              <h2 className="font-bold text-slate-900 leading-tight md:text-base text-sm truncate max-w-[150px] md:max-w-none">{restaurant.name}</h2>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1 hidden md:flex">
                <Star className={`w-3 h-3 ${averageRating === 'Yet to get Review' ? 'text-slate-300' : 'text-yellow-400 fill-yellow-400'}`} /> {averageRating} • {restaurant.deliveryTime}
              </p>
            </div>
            
            <div className="flex items-center gap-4 ml-auto">
              {customer ? (
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="relative group hidden sm:block">
                    <button className="text-sm border-r border-slate-200 pr-4 flex items-center gap-2 hover:text-brand-500 transition-colors">
                      {customer.avatar ? (
                        <img src={customer.avatar} alt="Profile" className="w-6 h-6 rounded-full bg-slate-100" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <span className="hidden md:inline font-medium">{customer.name}</span>
                    </button>
                    <div className="absolute right-4 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-slate-700 py-2 z-50">
                      <Link to="/profile" className="block px-4 py-2 hover:bg-slate-50 transition-colors text-sm">Profile</Link>
                      <Link to="/addresses" className="block px-4 py-2 hover:bg-slate-50 transition-colors text-sm">Addresses</Link>
                      <Link to="/orders" className="block px-4 py-2 hover:bg-slate-50 transition-colors text-sm">Order History</Link>
                    </div>
                  </div>
                  <button onClick={logout} className="text-sm opacity-80 hover:text-red-500 transition-colors hidden sm:block" title="Logout">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-brand-500 transition-colors mr-2">
                   Login
                </Link>
              )}
              
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-cart'))}
                className="flex items-center gap-2 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium text-sm transition-colors relative"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="relative h-72 md:h-96 bg-slate-900 border-b border-slate-200">
        <img 
          src={getCloudinaryUrl(restaurant.image, 800, 'good')} 
          alt={restaurant.name} 
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
        <div className="absolute top-6 left-6 z-10">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition-colors border border-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute bottom-8 left-6 md:bottom-12 md:left-12 text-white">
          <h1 className="font-sans text-4xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-md">{restaurant.name}</h1>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm md:text-base font-medium opacity-90">
              <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur">
                <Star className={`w-4 h-4 ${averageRating === 'Yet to get Review' ? 'text-white/50' : 'text-yellow-400 fill-yellow-400'}`} />
                {averageRating}
              </span>
              <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur">
                <Clock className="w-4 h-4" />
                {restaurant.deliveryTime}
              </span>
              <span className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur">
                {restaurant.cuisine}
              </span>
            </div>
            
            {restaurant.address && (
              <div className="flex items-center gap-2 text-sm text-white/90">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur">
                  <MapPin className="w-4 h-4 shrink-0 text-brand-400" />
                  <span className="truncate max-w-[200px] md:max-w-none">{restaurant.address}</span>
                  <a 
                    href={restaurant.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-brand-400 hover:text-brand-300 font-bold underline decoration-brand-400/50 underline-offset-2 transition-colors whitespace-nowrap"
                  >
                    Directions
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Sticky Mini Navbar & Sorting */}
        <div className="sticky top-16 md:top-20 z-40 bg-slate-50/95 backdrop-blur-md py-4 border-b border-slate-200 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all
                  ${activeCategory === cat 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex justify-end shrink-0">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value)}
                className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
              >
                <option value="default">Default sorting</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="pb-16">
          {Object.entries(groupedMenu).map(([category, items]) => {
            const menuItemsArray = items as MenuItem[];
            return (
            <div key={category} className="mb-12 last:mb-0">
              <h2 className="font-sans text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                {category} <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{menuItemsArray.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {menuItemsArray.map(item => {
                  const quantity = getItemQuantity(item._id);
                  return (
                  <div 
                    key={item._id} 
                    className="p-5 border border-slate-200 rounded-2xl shadow-sm hover:border-brand-300 hover:shadow-md transition-all group bg-white flex flex-col h-full"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <h3 className="font-bold text-lg text-slate-900 leading-tight">{item.name}</h3>
                        <span className="font-bold text-xl text-brand-600 shrink-0">₹{Number(item.price || 0).toFixed(2)}</span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed mb-6">{item.description}</p>
                    </div>
                    
                    <div className="flex items-end justify-between mt-auto">
                      <div className="flex-1"></div>
                      {quantity > 0 ? (
                        <div className="flex items-center gap-3 bg-brand-50 rounded-xl p-1.5 border border-brand-200 shrink-0 shadow-sm">
                          <button 
                            onClick={() => handleDecreaseQuantity(item._id, quantity)}
                            className="p-1.5 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-brand-700 min-w-[2rem] text-center">
                            {quantity.toString().padStart(2, '0')}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item._id, quantity + 1)}
                            className="p-1.5 bg-brand-500 text-white hover:bg-brand-600 rounded-lg transition-colors shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(item)}
                          className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-brand-500 text-brand-600 hover:bg-brand-50 rounded-xl font-bold transition-colors shadow-sm shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            </div>
          );})}
          {(!menuItems || menuItems.length === 0) && (
            <p className="text-center text-slate-500 italic py-12">No menu items found for this restaurant.</p>
          )}

          {/* Reviews Section */}
          <div className="mt-16 pt-12 border-t border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-sans text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" /> Customer Reviews
              </h2>
              <button 
                onClick={() => setShowReviews(!showReviews)}
                className="px-6 py-2.5 rounded-xl font-bold transition-all bg-white text-slate-700 border border-slate-200 hover:border-brand-500 hover:text-brand-600 shadow-sm"
              >
                {showReviews ? 'Hide Reviews' : 'Read Reviews'}
              </button>
            </div>
            
            {showReviews && (
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {loadingReviews ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                    </div>
                  ) : reviews && reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {reviews.map((review: any) => (
                        <div key={review._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 text-white font-bold rounded-full flex items-center justify-center uppercase shadow-sm">
                                {review.customerName ? review.customerName.charAt(0) : 'C'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{review.customerName || 'Anonymous Customer'}</p>
                                <p className="text-xs text-slate-500 font-medium">{new Date(review.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex gap-0.5 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                  key={star} 
                                  className={`w-3.5 h-3.5 ${review.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">No reviews yet</h3>
                      <p className="text-slate-500 text-sm max-w-sm mx-auto">Be the first to review after ordering! Your feedback helps others make great choices.</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
