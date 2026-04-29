import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function AdminRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    cuisine: '',
    address: '',
    deliveryTime: '30-45 min',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          rating: 0,
          tags: formData.cuisine ? [formData.cuisine] : []
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register restaurant');
      }

      // Automatically login or direct to login
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'admin');
      if (data.restaurantId) {
        localStorage.setItem('restaurantId', data.restaurantId);
      }
      // Force reload to update auth context
      window.location.href = '/admin';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4"
    >
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        
        <div className="flex flex-col flex-1 items-center mb-8">
          <div className="flex items-center gap-3 mb-4 group">
            {!imgError ? (
              <img 
                src="/logo_black.png" 
                alt="Food Bites" 
                className="h-12 w-auto object-contain transition-transform group-hover:scale-105" 
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-12 h-12 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                FB
              </div>
            )}
            <span className="font-sans font-bold text-2xl text-slate-900 tracking-tight">
              Food Bites
            </span>
          </div>
          <h1 className="text-xl font-medium text-slate-700">Partner with Us</h1>
          <p className="text-slate-500 text-sm mt-1">Register your restaurant</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant Name</label>
            <input
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              placeholder="The Golden Frying Pan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              placeholder="admin@restaurant.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Primary Cuisine</label>
            <input
              name="cuisine"
              type="text"
              required
              value={formData.cuisine}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              placeholder="e.g. Italian, Indian, Fast Food"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant Address</label>
            <input
              name="address"
              type="text"
              required
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              placeholder="123 Food Street, City"
            />
          </div>

          <div className="flex items-start gap-3 mt-4">
            <input 
               type="checkbox" 
               required 
               id="terms" 
               className="mt-1 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500" 
            />
            <label htmlFor="terms" className="text-sm text-slate-600">
               I agree to the <a href="#" className="text-brand-600 hover:underline">Terms & Conditions</a>. I understand that the platform charges a percentage fee per order depending on my agreement, and I will bear 50% of any coupon discounts subsidized by the platform.
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Partner Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <Link to="/admin/login" className="font-medium text-brand-500 hover:text-brand-600">
            Already have a partner account? Sign in
          </Link>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
            &larr; Back to customer app
          </button>
        </div>
      </div>
    </motion.div>
  );
}
