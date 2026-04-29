import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { InlineLoader, LoadingScreen } from '../../components/Loader';

export function Analytics() {
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState('lifetime');
  const [month, setMonth] = useState('');

  useEffect(() => {
    // Set default month to current local month
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    setMonth(`${now.getFullYear()}-${mm}`);
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        let url = `/api/admin/stats?period=${period}`;
        if (period === 'monthly' && month) {
          url += `&month=${month}`;
        }
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setStats(data);
      } catch(err) {
        console.error(err);
      }
    };
    if (period === 'lifetime' || (period === 'monthly' && month)) {
      fetchAnalytics();
    }
  }, [period, month]);

  if (!stats) return <LoadingScreen />;

  // Gross Profit = Subtotal + Delivery Charge - (Platform Fee to App) - (Discount / 2)
  const netRevenue = (stats.totalSubtotal || 0) + (stats.totalDeliveryCharge || 0) - (stats.totalRestaurantPlatformFee || 0) - ((stats.totalDiscount || 0) / 2);
  const couponExpenses = (stats.totalDiscount || 0) / 2;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Financial Metrics</h2>
        <div className="flex items-center gap-4">
          {period === 'monthly' && (
            <input 
              type="month" 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          )}
          <div className="bg-slate-100 p-1 rounded-lg inline-flex">
            <button onClick={() => setPeriod('lifetime')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${period === 'lifetime' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Lifetime</button>
            <button onClick={() => setPeriod('monthly')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${period === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Monthly</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-brand-500 flex flex-col justify-center">
          <p className="text-sm text-slate-500 mb-2">Gross Profit / Loss</p>
          <p className={`text-4xl font-black ${netRevenue >= 0 ? 'text-green-600' : 'text-red-500'}`}>₹{netRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-2">Total Orders</p>
          <p className="text-3xl font-black text-slate-900">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-2">Delivery Charges Collected</p>
          <p className="text-3xl font-black text-slate-900">₹{(stats.totalDeliveryCharge || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-2">Platform Fees Paid</p>
          <p className="text-3xl font-black text-slate-900">₹{(stats.totalRestaurantPlatformFee || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-2">Coupon Expenses (50%)</p>
          <p className="text-3xl font-black text-slate-900">₹{couponExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-2">Taxes Collected</p>
          <p className="text-3xl font-black text-slate-900">₹{(stats.totalTax || 0).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
