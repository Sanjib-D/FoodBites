import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { InlineLoader } from '../../components/Loader';
import { useNavigate } from 'react-router-dom';

export function LiveOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
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
        <h2 className="text-xl font-bold text-slate-800">Live Orders</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 font-semibold">Order ID</th>
              <th className="px-6 py-3 font-semibold">Date & Time</th>
              <th className="px-6 py-3 font-semibold">Customer Name</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr><td colSpan={5}><InlineLoader text="Loading orders..." /></td></tr>
            ) : orders.filter(o => o.status !== 'Delivered').length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">No live orders</td></tr>
            ) : (
              orders.filter(o => o.status !== 'Delivered').map(order => {
                return (
                <React.Fragment key={order._id}>
                  <tr className="hover:bg-slate-50 align-top">
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{order._id}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                        <p className="font-medium whitespace-nowrap">{order.customerInfo?.name || 'Guest'}</p>
                        <p className="text-xs text-slate-400 whitespace-nowrap">{order.customerInfo?.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase whitespace-nowrap
                        ${order.status === 'Pending' ? 'bg-orange-100 text-orange-700' : ''}
                        ${order.status === 'Preparing' ? 'bg-blue-100 text-blue-700' : ''}
                        ${order.status === 'On the way' ? 'bg-indigo-100 text-indigo-700' : ''}
                      `}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-4">
                        <div className="w-24 shrink-0 text-right">
                          {order.status === 'Pending' && (
                            <button onClick={() => handleUpdateStatus(order._id, 'Preparing')} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded font-medium hover:bg-slate-800 transition-colors w-full">Accept</button>
                          )}
                          {order.status === 'Preparing' && (
                            <button onClick={() => handleUpdateStatus(order._id, 'On the way')} className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-600 transition-colors w-full">Dispatch</button>
                          )}
                          {order.status === 'On the way' && (
                            <button onClick={() => handleUpdateStatus(order._id, 'Delivered')} className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded font-medium hover:bg-brand-600 transition-colors w-full">Complete</button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  {/* Items Row */}
                  <tr className="border-b-2 border-slate-200">
                    <td colSpan={5} className="px-6 py-4 bg-slate-50/50">
                      <div className="max-w-2xl px-4 py-2 bg-white rounded border border-slate-100 shadow-sm">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Order Items</h4>
                        <div className="space-y-1">
                          {order.items?.map((i:any, idx:number) => (
                            <div key={idx} className="flex gap-4 items-center">
                               <span className="font-bold text-slate-700 text-sm">{i.quantity}x</span>
                               <span className="text-slate-600 font-medium">{i.name}</span>
                               <span className="text-slate-400 text-xs ml-auto">₹{(i.price * i.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

