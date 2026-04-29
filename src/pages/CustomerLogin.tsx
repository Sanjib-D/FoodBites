import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export function CustomerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const searchParams = new URLSearchParams(window.location.search);
  const redirectParams = searchParams.get('redirect') || '/';

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/customers/login' : '/api/customers/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        login(data.customer);
        navigate(redirectParams);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 bg-slate-50 flex justify-center items-center p-4"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 shadow-sm rounded-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLogin ? 'Login to view your orders and fast checkout' : 'Sign up for a faster checkout experience'}
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
          </div>
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Address</label>
                <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="w-full mt-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors">
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-brand-500 font-medium hover:text-brand-600">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3 text-center">
          <Link to="/admin/login" className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
            Restaurant Owner Login &rarr;
          </Link>
          <Link to="/superadmin/login" className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
            Super Admin Control Panel &rarr;
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
