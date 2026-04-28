import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export function OrderHistory() {
  const { customer } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customer) {
      fetch(`/api/customers/${customer._id}/orders`)
        .then(res => res.json())
        .then(data => {
          setOrders(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [customer]);

  if (!customer) return <div className="p-8 text-center text-slate-500">Please log in to view order history.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Order History</h1>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">No orders yet</h2>
          <p className="text-slate-500 mb-6">Looks like you haven't placed any orders yet.</p>
          <Link to="/" className="px-6 py-3 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors inline-block">
            Start Ordering
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link to={`/order/${order._id}`} key={order._id} className="block bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between md:items-center gap-4 group">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-slate-900 text-lg group-hover:text-brand-600 transition-colors">Order #{order._id.slice(-6).toUpperCase()}</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold capitalize">
                    {order.status}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mb-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                <div className="text-sm font-medium text-slate-700 mt-2">
                  {order.restaurantId?.name || 'Restaurant'}, {order.items?.length || 0} items
                </div>
              </div>
              <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                <div className="font-black text-xl text-brand-600">₹{Number(order.total || 0).toFixed(2)}</div>
                <span className="text-sm font-bold text-brand-500 group-hover:text-brand-600 flex items-center gap-1">
                  View Details
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
