import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Star, Clock, Search, UtensilsCrossed } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { getCloudinaryUrl } from '../utils/cloudinary';

interface Restaurant {
  _id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  image: string;
  tags: string[];
}

interface MenuItem {
  _id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export function Home() {
  const { data: latestRestaurants, loading, error } = useApi<Restaurant[]>('/api/restaurants');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ restaurants: Restaurant[], items: MenuItem[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'restaurants' | 'items'>('all');
  const { dispatch } = useCart();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => res.json())
          .then(data => {
            setSearchResults(data);
            setIsSearching(false);
          })
          .catch(err => {
            console.error(err);
            setIsSearching(false);
          });
      } else {
        setSearchResults(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center sm:text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-sans font-bold text-slate-900 mb-4 tracking-tight">
            What are you craving?
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl">
            Order food from the best restaurants in town, delivered fast to your door.
          </p>
        </div>
        <div className="w-full md:w-96 relative shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search for restaurants or dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm transition-all"
            />
          </div>
          {searchQuery.trim().length > 1 && (
            <div className="flex gap-2 mt-3 items-center justify-end">
              <button 
                onClick={() => setSearchFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${searchFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All
              </button>
              <button 
                onClick={() => setSearchFilter('restaurants')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${searchFilter === 'restaurants' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Restaurants
              </button>
              <button 
                onClick={() => setSearchFilter('items')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${searchFilter === 'items' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Dishes
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && !searchResults && (
        <div className="flex-1 flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      )}

      {error && !searchResults && (
        <div className="flex-1 flex justify-center items-center text-red-500 font-medium py-20">
          Failed to load restaurants. Please try again.
        </div>
      )}

      {isSearching ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : searchResults ? (
        <div className="space-y-12 animate-in fade-in duration-500">
           {searchResults.restaurants.length === 0 && searchResults.items.length === 0 && (
             <div className="text-center py-12 text-slate-500">
               No results found for "{searchQuery}". Try a different term.
             </div>
           )}

           {searchResults.restaurants.length > 0 && (searchFilter === 'all' || searchFilter === 'restaurants') && (
             <div>
               <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <UtensilsCrossed className="w-6 h-6 text-brand-500" /> Restaurants
               </h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {searchResults.restaurants.map((restaurant, i) => (
                    <RestaurantCard key={restaurant._id} restaurant={restaurant} index={i} />
                 ))}
               </div>
             </div>
           )}

           {searchResults.items.length > 0 && (searchFilter === 'all' || searchFilter === 'items') && (
             <div>
               <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <Star className="w-6 h-6 text-brand-500" /> Food Items
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {searchResults.items.map(item => (
                   <div key={item._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                     <div>
                       <h4 className="font-bold text-slate-900">{item.name}</h4>
                       <p className="text-sm text-slate-500 line-clamp-1">{item.description}</p>
                       <p className="text-brand-600 font-bold mt-1">₹{item.price.toFixed(2)}</p>
                     </div>
                     <Link to={`/restaurant/${item.restaurantId}`} className="ml-4 shrink-0 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
                       View Info
                     </Link>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestRestaurants?.map((restaurant, i) => (
            <RestaurantCard key={restaurant._id} restaurant={restaurant} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function RestaurantCard({ restaurant, index }: { restaurant: Restaurant, index: number }) {
  return (
    <Link to={`/restaurant/${restaurant._id}`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200 cursor-pointer h-full flex flex-col"
      >
        <div className="relative h-48 overflow-hidden bg-slate-100">
          <img 
            src={getCloudinaryUrl(restaurant.image, 400, 'low')} 
            alt={restaurant.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm text-slate-800">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 stroke-yellow-400" />
            {restaurant.rating}
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="font-sans font-bold text-xl text-slate-900 mb-2 truncate">
            {restaurant.name}
          </h3>
          <div className="text-slate-500 text-sm flex items-center gap-4 mb-4">
            <span className="flex items-center gap-1">
              <UtensilsIcon className="w-4 h-4 opacity-50" />
              {restaurant.cuisine}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 opacity-50" />
              {restaurant.deliveryTime}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-auto">
            {restaurant.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2.5 py-1 bg-brand-100 text-brand-600 rounded text-[10px] font-bold uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function UtensilsIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
  );
}
