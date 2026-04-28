import React, { useState, useEffect } from 'react';
import { Shield, Store, Tag, Settings, BarChart, FileText, Trash2, Briefcase, Filter, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [settings, setSettings] = useState({ deliveryCharge: 0, platformFee: 0, taxRate: 5 });
  const [stats, setStats] = useState<any>({ 
    totalRevenue: 0, totalOrders: 0, paddingOrders: 0, completedOrders: 0,
    totalDeliveryCharge: 0, totalPlatformFee: 0, totalDiscount: 0, restaurantStats: []
  });
  const [period, setPeriod] = useState('lifetime');
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
  }, [period]);

  const fetchData = async () => {
    try {
      const [restRes, coupRes, settRes, statRes, appRes, jobRes] = await Promise.all([
        fetchWithAuth('/api/restaurants/all'),
        fetchWithAuth('/api/superadmin/coupons'),
        fetchWithAuth('/api/superadmin/settings'),
        fetchWithAuth(`/api/admin/stats?period=${period}`),
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

  const createCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCoupon = {
      code: (formData.get('code') as string).toUpperCase(),
      discount: Number(formData.get('discount')),
      type: formData.get('type')
    };
    try {
      const res = await fetchWithAuth(`/api/superadmin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add coupon');
      e.currentTarget.reset();
      
      // Update local state directly with the returned coupon
      setCoupons(prev => {
        // Only add if not already in the list
        if (prev.find(c => c.code === data.coupon.code)) return prev;
        return [...prev, data.coupon];
      });
    } catch (err: any) {
      alert(err.message || 'Failed to add coupon');
    }
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
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button onClick={() => {
              localStorage.removeItem('token');
              navigate('/superadmin/login');
           }} className="text-slate-400 hover:text-white text-sm">Logout</button>
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
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" /> Post New Job
              </h3>
              <form onSubmit={postJob} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input name="title" placeholder="Job Title" required className="px-4 py-2 border rounded-lg outline-none focus:border-brand-500" />
                <select name="type" className="px-4 py-2 border rounded-lg outline-none focus:border-brand-500">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
                <input name="location" placeholder="Location e.g. Remote" required className="px-4 py-2 border rounded-lg outline-none focus:border-brand-500" />
                <button type="submit" className="md:col-span-3 py-2 bg-brand-500 text-white rounded-lg font-bold hover:bg-brand-600 transition-colors">
                  Post Job
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 text-lg">Active Postings</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {jobs.length === 0 ? <div className="p-8 text-center text-slate-500">No active job postings.</div> : jobs.map(job => (
                  <div key={job._id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <h4 className="font-bold text-slate-900">{job.title}</h4>
                      <p className="text-sm text-slate-500">{job.type} • {job.location}</p>
                    </div>
                    <button onClick={() => deleteJob(job._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Financial Metrics</h3>
              <div className="bg-white rounded-lg p-1 border border-slate-200">
                <button onClick={() => setPeriod('lifetime')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${period === 'lifetime' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Lifetime</button>
                <button onClick={() => setPeriod('monthly')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${period === 'monthly' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Monthly</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Total System Revenue</p>
                <p className="text-3xl font-black text-slate-900">₹{(stats.totalRevenue || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Delivery Charges</p>
                <p className="text-3xl font-black text-slate-900">₹{(stats.totalDeliveryCharge || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Platform Fees</p>
                <p className="text-3xl font-black text-slate-900">₹{(stats.totalPlatformFee || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Coupon Expenses</p>
                <p className="text-3xl font-black text-red-600">₹{(stats.totalDiscount || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-brand-500 flex flex-col justify-center">
                 <p className="text-sm text-slate-500 mb-2">Platform Net Profit/Loss</p>
                 <p className={`text-4xl font-black ${(stats.totalDeliveryCharge + stats.totalPlatformFee - stats.totalDiscount) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                   ₹{((stats.totalDeliveryCharge || 0) + (stats.totalPlatformFee || 0) - (stats.totalDiscount || 0)).toFixed(2)}
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-xl">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Global Charges</h3>
            </div>
            <form onSubmit={updateSettings} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Standard Delivery Charge (₹)</label>
                <input 
                  type="number" 
                  value={settings.deliveryCharge}
                  onChange={(e) => setSettings({...settings, deliveryCharge: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Platform Operations Fee (₹)</label>
                <input 
                  type="number" 
                  value={settings.platformFee}
                  onChange={(e) => setSettings({...settings, platformFee: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Tax (%)</label>
                <input 
                  type="number" 
                  value={settings.taxRate}
                  onChange={(e) => setSettings({...settings, taxRate: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <button className="w-full bg-slate-900 text-white font-medium py-3 rounded-lg hover:bg-slate-800 transition-colors">
                Save Changes
              </button>
              {saveMessage && (
                <div className={`p-3 rounded-lg text-sm text-center ${saveMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {saveMessage}
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
               <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Active Coupons</h3>
               </div>
               <div className="p-6 space-y-4">
                 {coupons.map(coupon => (
                   <div key={coupon._id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
                     <div>
                       <p className="font-bold text-slate-800 uppercase">{coupon.code}</p>
                       <p className="text-sm text-slate-500">
                         {coupon.type === 'fixed' ? `₹${coupon.discount} OFF` : `${coupon.discount}% OFF`}
                       </p>
                     </div>
                     <button onClick={() => deleteCoupon(coupon._id)} className="text-red-500 text-sm hover:text-red-700">Delete</button>
                   </div>
                 ))}
               </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-fit">
               <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Create New</h3>
               </div>
               <form onSubmit={createCoupon} className="p-6 space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Coupon Code</label>
                   <input required name="code" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500" placeholder="e.g. SUMMER20" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Discount Value</label>
                   <input required type="number" name="discount" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500" placeholder="e.g. 50" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type</label>
                   <select name="type" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white">
                     <option value="fixed">Fixed Amount (₹)</option>
                     <option value="percentage">Percentage (%)</option>
                   </select>
                 </div>
                 <button className="w-full bg-brand-500 text-white font-medium py-3 rounded-lg hover:bg-brand-600 transition-colors mt-4">
                    Create Coupon
                 </button>
               </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
