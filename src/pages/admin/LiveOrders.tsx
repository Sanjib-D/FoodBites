import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

export function LiveOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      setOrders(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const inv = setInterval(fetchOrders, 10000);
    return () => clearInterval(inv);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchOrders();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">All Live Orders</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 font-semibold">Order ID</th>
              <th className="px-6 py-3 font-semibold">Date</th>
              <th className="px-6 py-3 font-semibold">Customer</th>
              <th className="px-6 py-3 font-semibold">Items</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Amount</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400">Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400">No recent orders</td></tr>
            ) : (
              orders.map(order => (
              <tr key={order._id}>
                <td className="px-6 py-4 font-mono text-slate-500 text-xs">{order._id.substring(0,8)}</td>
                <td className="px-6 py-4 text-slate-500 text-xs">{new Date(order.createdAt).toLocaleString()}</td>
                <td className="px-6 py-4">
                    <p className="font-medium">{order.customerInfo?.name || 'Guest'}</p>
                    <p className="text-xs text-slate-400">{order.customerInfo?.phone}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-[200px] hover:overflow-visible hover:whitespace-normal truncate">
                    {order.items?.map((i:any) => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>
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
  );
}
