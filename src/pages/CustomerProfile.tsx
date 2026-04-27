import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AVATARS = [
  "https://api.dicebear.com/7.x/notionists/svg?seed=Felix",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Luna",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Jack",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Milo",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Abby",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Penny",
];

export function CustomerProfile() {
  const { customer, updateCustomer, logout } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    gender: customer?.gender || '',
    addresses: customer?.addresses?.length ? customer.addresses : [customer?.address || ''],
    avatar: customer?.avatar || AVATARS[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!customer) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    try {
      const res = await fetch(`/api/customers/${customer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        updateCustomer(data.customer);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
          <button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors">
            Log out
          </button>
        </div>
        
        <div className="p-6">
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-100">
              Profile updated successfully!
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-md bg-slate-50">
                <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-slate-400 font-normal">(Cannot be changed)</span></label>
                <input 
                  type="email" 
                  value={customer.email}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select 
                  value={formData.gender || ''}
                  onChange={(e) => {
                    const gender = e.target.value;
                    let avatar = AVATARS[0]; // fallback
                    if (gender === 'Male') avatar = 'https://api.dicebear.com/7.x/notionists/svg?seed=Jack';
                    if (gender === 'Female') avatar = 'https://api.dicebear.com/7.x/notionists/svg?seed=Luna';
                    if (gender === 'Other') avatar = 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix';
                    
                    setFormData({...formData, gender, avatar});
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                  required
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
