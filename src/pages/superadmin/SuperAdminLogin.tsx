import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        navigate('/superadmin/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-slate-900 flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-800 p-8 text-center text-white relative flex flex-col items-center">
          <button 
            onClick={() => navigate('/')} 
            className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            &larr; Back to Store
          </button>
          
          <div className="flex items-center gap-3 mb-4 mt-8 group">
            {!imgError ? (
              <img 
                src="/logo_white.png" 
                alt="Food Bites" 
                className="h-14 w-auto object-contain transition-transform group-hover:scale-105" 
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-14 h-14 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold">
                <Lock className="w-7 h-7 text-white" />
              </div>
            )}
            <span className="font-sans font-bold text-3xl tracking-tight text-white">
              Food Bites
            </span>
          </div>

          <h2 className="text-xl font-medium text-slate-200">Super Admin Access</h2>
          <p className="text-slate-400 text-sm mt-1">Global Control Panel</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Admin ID</label>
            <input 
              type="text" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              placeholder="superadmin@foodbites.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Login to Control Panel'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
