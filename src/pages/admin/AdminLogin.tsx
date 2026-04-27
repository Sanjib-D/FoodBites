import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        if (data.restaurantId) {
          localStorage.setItem('restaurantId', data.restaurantId);
        }
        navigate('/admin/dashboard');
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
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
          <h1 className="text-xl font-medium text-slate-700">Restaurant Login</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your restaurant operations</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              placeholder="manager@restaurant.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
              <input type="checkbox" className="rounded text-brand-500 focus:ring-brand-500" />
              Remember me
            </label>
            <a href="#" className="text-sm font-medium text-brand-500 hover:text-brand-600">Forgot password?</a>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-500">
          Demo purpose: use any credentials to login
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
                &larr; Back to customer app
            </button>
        </div>
      </div>
    </div>
  );
}
