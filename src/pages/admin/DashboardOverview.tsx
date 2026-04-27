import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';

export function DashboardOverview() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, pendingOrders: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/stats')
      ]);
      const oData = await ordersRes.json();
      const sData = await statsRes.json();
      setOrders(oData.slice(0, 5)); // Just the 5 most recent for overview
      setStats(sData);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchDashboardData();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900">₹{stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-slate-900">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Pending Orders</p>
          <p className="text-2xl font-bold text-slate-900">{stats.pendingOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Avg. Prep Time</p>
          <p className="text-2xl font-bold text-slate-900">14.2 min</p>
          <p className="text-brand-500 text-xs font-semibold mt-2">↓ 2 min reduction</p>
        </div>
      </div>

      {/* Main View Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Live Orders</h3>
            <span className="text-xs text-brand-600 font-bold bg-brand-50 px-2 py-1 rounded">{stats.pendingOrders} Pending</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-semibold">Order ID</th>
                  <th className="px-6 py-3 font-semibold">Customer</th>
                  <th className="px-6 py-3 font-semibold">Items</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">Loading orders...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">No recent orders</td></tr>
                ) : (
                  orders.map(order => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{order._id.substring(0,8)}...</td>
                    <td className="px-6 py-4 font-medium">{order.customerInfo?.name || 'Guest'}</td>
                    <td className="px-6 py-4 truncate max-w-[150px]" title={order.items?.map((i:any) => `${i.quantity}x ${i.name}`).join(', ')}>
                      {order.items?.map((i:any) => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                        ${order.status === 'Pending' ? 'bg-orange-100 text-orange-700' : ''}
                        ${order.status === 'Preparing' ? 'bg-blue-100 text-blue-700' : ''}
                        ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : ''}
                      `}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹{order.total?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                        {order.status === 'Pending' && (
                          <button onClick={() => handleUpdateStatus(order._id, 'Preparing')} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded font-medium hover:bg-slate-800 transition-colors">Accept</button>
                        )}
                        {order.status === 'Preparing' && (
                          <button onClick={() => handleUpdateStatus(order._id, 'Delivered')} className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded font-medium hover:bg-brand-600 transition-colors">Complete</button>
                        )}
                        {order.status === 'Delivered' && (
                          <span className="text-xs text-slate-400"><CheckCircle className="w-4 h-4 inline-block mr-1"/>Done</span>
                        )}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Popular Items Sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Top Performing Dishes</h3>
          </div>
          <div className="p-5 space-y-4 flex-1">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center text-xl">🍝</div>
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-900">Truffle Tagliatelle</p>
                <p className="text-xs text-slate-400">Trending 🔥</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center text-xl">🍔</div>
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-900">Bacon Beast Burger</p>
                <p className="text-xs text-slate-400">Trending 🔥</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
