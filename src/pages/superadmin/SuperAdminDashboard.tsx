import React, { useState, useEffect } from 'react';
import { Shield, Store, Tag, Settings, BarChart, FileText, Trash2, Briefcase, Filter, Plus, MessageSquare, Edit2, LogOut, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SuperAdminReviews } from './SuperAdminReviews';
import { SuperAdminOrders } from './SuperAdminOrders';

const fetchWithAuth = async (url: string, options: any = {}) => {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

export function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tabKey, setTabKey] = useState(Date.now());

  const handleTabClick = (tabName: string) => {
    if (activeTab === tabName) {
      setTabKey(Date.now());
    } else {
      setActiveTab(tabName);
    }
  };

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ deliveryCharge: 0, platformFee: 0, taxRate: 5, restaurantFeePercent: 5, restaurantFeeFixed: 10 });
  const [stats, setStats] = useState<any>({ 
    totalRevenue: 0, totalOrders: 0, paddingOrders: 0, completedOrders: 0,
    totalSubtotal: 0, totalDeliveryCharge: 0, totalPlatformFee: 0, 
    totalRestaurantPlatformFee: 0, totalDiscount: 0, totalTax: 0, restaurantStats: []
  });
  const [period, setPeriod] = useState('lifetime');
  const [month, setMonth] = useState('');

  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState({ code: '', discount: '', type: 'fixed', maxDiscount: '' });

  useEffect(() => {
    // Set default month to current local month
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    setMonth(`${now.getFullYear()}-${mm}`);
  }, []);
  const [restSortBy, setRestSortBy] = useState('totalSales');
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobFilter, setJobFilter] = useState('All');
  const [saveMessage, setSaveMessage] = useState('');
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/superadmin/login');
      return;
    }
    fetchData();
  }, [period, month]);

  const fetchData = async () => {
    try {
      let statUrl = `/api/admin/stats?period=${period}`;
      if (period === 'monthly' && month) {
        statUrl += `&month=${month}`;
      }
      const [restRes, coupRes, settRes, statRes, appRes, jobRes] = await Promise.all([
        fetchWithAuth('/api/restaurants/all'),
        fetchWithAuth('/api/superadmin/coupons'),
        fetchWithAuth('/api/superadmin/settings'),
        fetchWithAuth(statUrl),
        fetchWithAuth('/api/superadmin/applications'),
        fetchWithAuth('/api/jobs')
      ]);
      setRestaurants(await restRes.json());
      setCoupons(await coupRes.json());
      setSettings(await settRes.json());
      setStats(await statRes.json());
      setApplications(await appRes.json());
      setJobs(await jobRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const updateRestaurantStatus = async (id: string, status: string) => {
    try {
      await fetchWithAuth(`/api/superadmin/restaurants/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const updateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/api/superadmin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      setSaveMessage('Settings updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Failed to update settings');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      await fetchWithAuth(`/api/superadmin/coupons/${id}`, { method: 'DELETE' });
      setCoupons(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert('Failed to delete coupon');
    }
  };

  const deleteApplication = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      await fetchWithAuth(`/api/superadmin/applications/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert('Failed to delete application');
    }
  };

  const deleteJob = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await fetchWithAuth(`/api/superadmin/jobs/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert('Failed to delete job');
    }
  };

  const postJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newJob = {
      title: formData.get('title'),
      type: formData.get('type'),
      location: formData.get('location')
    };
    try {
      await fetchWithAuth(`/api/superadmin/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
      });
      fetchData();
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      alert('Failed to create job posting');
    }
  };

  const submitCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!couponForm.code.trim() || !couponForm.discount) return;
    
    const newCoupon: any = {
      code: couponForm.code.toUpperCase(),
      discount: Number(couponForm.discount),
      type: couponForm.type
    };
    if (couponForm.type === 'percentage' && couponForm.maxDiscount) {
      newCoupon.maxDiscount = Number(couponForm.maxDiscount);
    }

    try {
      const url = editingCouponId 
        ? `/api/superadmin/coupons/${editingCouponId}` 
        : `/api/superadmin/coupons`;
      
      const res = await fetchWithAuth(url, {
        method: editingCouponId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save coupon');
      
      setEditingCouponId(null);
      setCouponForm({ code: '', discount: '', type: 'fixed', maxDiscount: '' });
      
      setCoupons(prev => {
        if (editingCouponId) {
          return prev.map(c => c._id === editingCouponId ? data.coupon : c);
        }
        if (prev.find(c => c.code === data.coupon.code)) return prev;
        return [...prev, data.coupon];
      });
    } catch (err: any) {
      alert(err.message || 'Failed to save coupon');
    }
  };

  const handleEditCoupon = (coupon: any) => {
    setEditingCouponId(coupon._id);
    setCouponForm({
      code: coupon.code,
      discount: String(coupon.discount),
      type: coupon.type,
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : ''
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col pt-6 shrink-0">
        <div className="px-6 mb-8 flex items-center gap-3">
          {!imgError ? (
            <img 
              src="/logo_white.png" 
              alt="Food Bites" 
              className="h-10 w-auto object-contain transition-transform hover:scale-105" 
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold">
              <Shield className="w-6 h-6 text-white" />
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight">Food Bites</h1>
        </div>
        <div className="px-4 mb-4">
          <button onClick={() => navigate('/')} className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-2">
            &larr; Back to Website
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <BarChart className="w-5 h-5" /> Overall Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('restaurants')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'restaurants' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Store className="w-5 h-5" /> Restaurant Onboarding
          </button>
          <button 
            onClick={() => setActiveTab('coupons')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'coupons' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Tag className="w-5 h-5" /> Coupons
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Settings className="w-5 h-5" /> Modify Charges
          </button>
          <button 
            onClick={() => setActiveTab('applications')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'applications' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <FileText className="w-5 h-5" /> Job Applications
          </button>
          <button 
            onClick={() => setActiveTab('jobs')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'jobs' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Briefcase className="w-5 h-5" /> Manage Jobs
          </button>
          <button 
            onClick={() => handleTabClick('reviews')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reviews' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <MessageSquare className="w-5 h-5" /> Reviews
          </button>
          <button 
            onClick={() => handleTabClick('orders')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'orders' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Receipt className="w-5 h-5" /> Orders
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button onClick={() => {
              localStorage.removeItem('token');
              navigate('/superadmin/login');
           }} className="text-slate-400 hover:text-white flex items-center justify-start gap-3 px-4 w-full py-3 hover:bg-slate-800 rounded-lg group transition-colors text-sm font-medium">
              <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
              <span>Log Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 capitalize">{activeTab.replace('-', ' ')}</h2>

        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <Filter className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Job</label>
                <select 
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none"
                >
                  <option value="All">All Jobs</option>
                  {Array.from(new Set(applications.map(a => a.jobTitle))).map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {applications.filter(app => jobFilter === 'All' || app.jobTitle === jobFilter).length === 0 ? (
                <div className="p-8 text-center text-slate-500">No applications found.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {applications.filter(app => jobFilter === 'All' || app.jobTitle === jobFilter).map(app => (
                    <div key={app._id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg mb-1">{app.name}</h3>
                          <p className="text-brand-600 font-medium mb-3">Applied for: {app.jobTitle}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-800">{app.email}</span></div>
                            <div><span className="text-slate-500">Phone:</span> <span className="font-medium text-slate-800">{app.phone}</span></div>
                            <div><span className="text-slate-500">Current Role:</span> <span className="font-medium text-slate-800">{app.currentRole}</span></div>
                            <div><span className="text-slate-500">Experience:</span> <span className="font-medium text-slate-800">{app.experience} Years</span></div>
                            <div className="md:col-span-2"><span className="text-slate-500">Qualification:</span> <span className="font-medium text-slate-800">{app.qualification}</span></div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between gap-4">
                          <div className="text-xs text-slate-400 whitespace-nowrap">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </div>
                          <button 
                            onClick={() => deleteApplication(app._id)}
                            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Application"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
               <div className="p-6 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-lg">Active Postings</h3>
               </div>
               <div className="p-6 grid grid-cols-1 gap-4">
                 {jobs.map(job => (
                   <div key={job._id} className="relative flex items-center justify-between p-5 bg-gradient-to-r from-brand-50 to-white border-2 border-brand-100 rounded-xl overflow-hidden group">
                     <div className="absolute left-0 top-0 bottom-0 w-2 bg-brand-500"></div>
                     <div>
                       <h4 className="font-black text-xl text-slate-800 tracking-tight mb-1">{job.title}</h4>
                       <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide">{job.type} • {job.location}</p>
                     </div>
                     <button onClick={() => deleteJob(job._id)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm focus:ring-2 focus:ring-red-200" title="Delete Job">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 ))}
                 {jobs.length === 0 && (
                   <div className="text-center py-10 text-slate-400 font-medium">No active job postings.</div>
                 )}
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-fit">
              <div className="p-6 border-b border-slate-100">
                 <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5 text-brand-500" /> Post New Job
                 </h3>
              </div>
              <form onSubmit={postJob} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                  <input name="title" placeholder="e.g. Senior Frontend Engineer" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Type</label>
                  <select name="type" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white">
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input name="location" placeholder="e.g. Remote, NY" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500" />
                </div>
                <button type="submit" className="w-full bg-brand-500 text-white font-medium py-3 rounded-lg hover:bg-brand-600 transition-colors mt-4">
                  Publish Job Posting
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-slate-800">Financial Metrics</h3>
              <div className="flex items-center gap-4">
                {period === 'monthly' && (
                  <input 
                    type="month" 
                    value={month} 
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                )}
                <div className="bg-white rounded-lg p-1 border border-slate-200">
                  <button onClick={() => setPeriod('lifetime')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${period === 'lifetime' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Lifetime</button>
                  <button onClick={() => setPeriod('monthly')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${period === 'monthly' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Monthly</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Total System Volume</p>
                <p className="text-3xl font-black text-slate-900">₹{(stats.totalRevenue || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Platform Fees (Customer)</p>
                <p className="text-3xl font-black text-slate-900">₹{(stats.totalPlatformFee || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Platform Fees (Restaurant)</p>
                <p className="text-3xl font-black text-slate-900">₹{(stats.totalRestaurantPlatformFee || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Coupon Expenses (50%)</p>
                <p className="text-3xl font-black text-red-600">₹{((stats.totalDiscount || 0) / 2).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Taxes Collected</p>
                <p className="text-3xl font-black text-slate-900">₹{(stats.totalTax || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-brand-500 flex flex-col justify-center">
                 <p className="text-sm text-slate-500 mb-2">Platform Net Profit/Loss</p>
                 <p className={`text-4xl font-black ${((stats.totalPlatformFee || 0) + (stats.totalRestaurantPlatformFee || 0) - ((stats.totalDiscount || 0) / 2)) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                   ₹{((stats.totalPlatformFee || 0) + (stats.totalRestaurantPlatformFee || 0) - ((stats.totalDiscount || 0) / 2)).toFixed(2)}
                 </p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500 mb-2">Platform Orders</p>
                    <p className="text-2xl font-black text-slate-900">{stats.totalOrders || 0}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500 mb-2">Active Restaurants</p>
                    <p className="text-2xl font-black text-slate-900">{restaurants.filter(r => r.status === 'approved').length}</p>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Top Restaurants Details</h3>
                  <select value={restSortBy} onChange={e => setRestSortBy(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 outline-none">
                     <option value="totalSales">Sort by Total Sales</option>
                     <option value="totalOrders">Sort by Total Orders</option>
                  </select>
               </div>
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                     <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Restaurant name</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Total Orders</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Total Sales</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {[...(stats.restaurantStats || [])].sort((a: any, b: any) => b[restSortBy] - a[restSortBy]).map((rs: any) => (
                        <tr key={rs.restaurantId} className="hover:bg-slate-50">
                           <td className="px-6 py-4 font-bold text-slate-900">{rs.name}</td>
                           <td className="px-6 py-4 text-slate-700">{rs.totalOrders}</td>
                           <td className="px-6 py-4 text-slate-700 font-medium tracking-tight">₹{rs.totalSales.toFixed(2)}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'restaurants' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cuisine</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {restaurants.map(rest => (
                  <tr key={rest._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{rest.name}</td>
                    <td className="px-6 py-4 text-slate-500">{rest.cuisine}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider
                        ${rest.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          rest.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}
                      >
                        {rest.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {rest.status !== 'approved' && (
                        <button onClick={() => updateRestaurantStatus(rest._id, 'approved')} className="text-brand-600 hover:text-brand-800 font-medium text-sm mr-4">Approve</button>
                      )}
                      {rest.status !== 'rejected' && (
                        <button onClick={() => updateRestaurantStatus(rest._id, 'rejected')} className="text-red-500 hover:text-red-700 font-medium text-sm">Reject</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Platform Financial Settings</h2>
            
            <form onSubmit={updateSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Facing Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-lg">Customer Charges</h3>
                    <p className="text-sm text-slate-500 mt-1">Fees charged directly to customers on every order.</p>
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Standard Delivery Fee</label>
                      <p className="text-xs text-slate-500 mb-2">Base delivery amount collected from customer.</p>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-medium">₹</span>
                        <input 
                          type="number" 
                          value={settings.deliveryCharge}
                          onChange={(e) => setSettings({...settings, deliveryCharge: Number(e.target.value)})}
                          className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all font-medium text-slate-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Platform Operations Fee</label>
                      <p className="text-xs text-slate-500 mb-2">Fixed fee for app maintenance & service.</p>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-medium">₹</span>
                        <input 
                          type="number" 
                          value={settings.platformFee}
                          onChange={(e) => setSettings({...settings, platformFee: Number(e.target.value)})}
                          className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all font-medium text-slate-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Government Tax Rate</label>
                      <p className="text-xs text-slate-500 mb-2">GST / VAT percentage applied to subtotal.</p>
                      <div className="relative">
                        <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 font-medium">%</span>
                        <input 
                          type="number" 
                          value={settings.taxRate}
                          onChange={(e) => setSettings({...settings, taxRate: Number(e.target.value)})}
                          className="w-full pl-4 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all font-medium text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Restaurant Facing Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-lg">Restaurant Commissions</h3>
                    <p className="text-sm text-slate-500 mt-1">Platform fees collected from restaurant payouts.</p>
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Commission Percentage</label>
                      <p className="text-xs text-slate-500 mb-2">Percentage fee charged on item subtotal.</p>
                      <div className="relative">
                        <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 font-medium">%</span>
                        <input 
                          type="number" 
                          value={settings.restaurantFeePercent ?? 5}
                          onChange={(e) => setSettings({...settings, restaurantFeePercent: Number(e.target.value)})}
                          className="w-full pl-4 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all font-medium text-slate-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Fixed Order Fee</label>
                      <p className="text-xs text-slate-500 mb-2">Flat amount charged to restaurant per order.</p>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-medium">₹</span>
                        <input 
                          type="number" 
                          value={settings.restaurantFeeFixed ?? 10}
                          onChange={(e) => setSettings({...settings, restaurantFeeFixed: Number(e.target.value)})}
                          className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all font-medium text-slate-900"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-brand-50 border border-brand-100 rounded-xl mt-4">
                      <div className="flex gap-3">
                        <svg className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                        <div className="text-sm text-brand-800">
                          <span className="font-bold block mb-1">How it is calculated:</span>
                          Total Platform Fee = (Subtotal × {settings.restaurantFeePercent ?? 5}%) + ₹{settings.restaurantFeeFixed ?? 10}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors shrink-0">
                  Save Configuration
                </button>
                <div className="h-10 flex items-center">
                  {saveMessage && (
                    <span className={`text-sm font-bold px-4 py-2 rounded-lg ${saveMessage.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} animate-in fade-in`}>
                      {saveMessage}
                    </span>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
               <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Active Coupons</h3>
               </div>
                <div className="p-6 grid grid-cols-1 gap-4">
                  {coupons.map(coupon => (
                    <div key={coupon._id} className="relative flex items-center justify-between p-5 bg-gradient-to-r from-brand-50 to-white border-2 border-brand-100 rounded-xl overflow-hidden group">
                      <div className={`absolute left-0 top-0 bottom-0 w-2 ${editingCouponId === coupon._id ? 'bg-orange-500' : 'bg-brand-500'}`}></div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-black text-xl text-slate-800 uppercase tracking-wider">{coupon.code}</p>
                          <span className="px-2 py-0.5 bg-brand-500 text-white text-[10px] font-bold rounded uppercase tracking-widest leading-none flex items-center">Active</span>
                        </div>
                        <p className="text-sm font-semibold text-brand-600">
                          {coupon.type === 'fixed' ? `₹${coupon.discount} Flat Discount` : `${coupon.discount}% Off${coupon.maxDiscount ? ` up to ₹${coupon.maxDiscount}` : ''}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditCoupon(coupon)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors shadow-sm focus:ring-2 focus:ring-orange-200" title="Edit Coupon">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteCoupon(coupon._id)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm focus:ring-2 focus:ring-red-200" title="Delete Coupon">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {coupons.length === 0 && (
                    <div className="text-center py-10 text-slate-400 font-medium">No coupons active. Create one to attract users!</div>
                  )}
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-fit">
               <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">{editingCouponId ? 'Edit Coupon' : 'Create New Coupon'}</h3>
                  {editingCouponId && (
                     <button onClick={() => {
                        setEditingCouponId(null);
                        setCouponForm({ code: '', discount: '', type: 'fixed', maxDiscount: '' });
                     }} className="text-sm text-slate-500 hover:text-slate-800 font-medium">
                        Cancel Edit
                     </button>
                  )}
               </div>
               <form onSubmit={submitCoupon} className="p-6 space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Coupon Code</label>
                   <input required value={couponForm.code} onChange={e => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500" placeholder="e.g. SUMMER20" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type</label>
                     <select value={couponForm.type} onChange={e => setCouponForm(prev => ({ ...prev, type: e.target.value }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white">
                       <option value="fixed">Fixed Amount (₹)</option>
                       <option value="percentage">Percentage (%)</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">{couponForm.type === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}</label>
                     <input required type="number" min="0" max={couponForm.type === 'percentage' ? 100 : undefined} value={couponForm.discount} onChange={e => setCouponForm(prev => ({ ...prev, discount: e.target.value }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500" placeholder="e.g. 50" />
                   </div>
                 </div>
                 {couponForm.type === 'percentage' && (
                   <div className="animate-in fade-in slide-in-from-top-2">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Discount per Order (₹)</label>
                     <input type="number" min="0" value={couponForm.maxDiscount} onChange={e => setCouponForm(prev => ({ ...prev, maxDiscount: e.target.value }))} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500" placeholder="e.g. 150 (Leave Empty for No Limit)" />
                   </div>
                 )}
                 <button className={`w-full text-white font-medium py-3 rounded-lg transition-colors mt-4 ${editingCouponId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-brand-500 hover:bg-brand-600'}`}>
                    {editingCouponId ? 'Save Changes' : 'Create Coupon'}
                 </button>
               </form>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <SuperAdminReviews key={tabKey} />
        )}
        {activeTab === 'orders' && (
          <SuperAdminOrders key={tabKey} />
        )}
      </main>
    </div>
  );
}
