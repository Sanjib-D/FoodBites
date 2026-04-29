import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { InlineLoader } from '../../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

export function LiveOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBillOrder, setSelectedBillOrder] = useState<any | null>(null);

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
              <tr><td colSpan={7}><InlineLoader text="Loading orders..." /></td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400">No recent orders</td></tr>
            ) : (
              orders.map(order => {
                const restAmount = (order.total || 0) - (order.platformFee || 0);
                return (
                <React.Fragment key={order._id}>
                  <tr className="hover:bg-slate-50">
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
                        ${order.status === 'On the way' ? 'bg-indigo-100 text-indigo-700' : ''}
                        ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : ''}
                      `}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹{restAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 flex items-center justify-end gap-2">
                       <button onClick={() => setSelectedBillOrder(order)} className="text-xs text-brand-600 font-medium hover:underline mr-4">View Bill Details</button>
                       {order.status === 'Pending' && (
                         <button onClick={() => handleUpdateStatus(order._id, 'Preparing')} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded font-medium hover:bg-slate-800 transition-colors">Accept</button>
                       )}
                       {order.status === 'Preparing' && (
                         <button onClick={() => handleUpdateStatus(order._id, 'On the way')} className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-600 transition-colors">Dispatch</button>
                       )}
                       {order.status === 'On the way' && (
                         <button onClick={() => handleUpdateStatus(order._id, 'Delivered')} className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded font-medium hover:bg-brand-600 transition-colors">Complete</button>
                       )}
                       {order.status === 'Delivered' && (
                         <span className="text-xs text-slate-400"><CheckCircle className="w-4 h-4 inline-block mr-1"/>Done</span>
                       )}
                    </td>
                  </tr>
                </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedBillOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 shrink-0">
                <h3 className="font-bold text-slate-800 text-lg">Bill Details & Expenses</h3>
                <button 
                  onClick={() => setSelectedBillOrder(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
                    <h4 className="font-semibold text-slate-700 mb-2 border-b border-slate-200 pb-2">Customer Receipt</h4>
                    <div className="flex justify-between py-1 text-sm"><span className="text-slate-500">Subtotal</span> <span className="font-medium text-slate-900">₹{(selectedBillOrder.subtotal || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between py-1 text-sm"><span className="text-slate-500">Delivery Charge</span> <span className="font-medium text-slate-900">₹{(selectedBillOrder.deliveryCharge || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between py-1 text-sm"><span className="text-slate-500">Tax</span> <span className="font-medium text-slate-900">₹{(selectedBillOrder.tax || 0).toFixed(2)}</span></div>
                    {selectedBillOrder.discount > 0 && <div className="flex justify-between py-1 text-sm"><span className="text-slate-500">Discount</span> <span className="font-medium text-green-600">-₹{(selectedBillOrder.discount).toFixed(2)}</span></div>}
                    <div className="flex justify-between py-2 font-bold border-t border-slate-200 mt-2"><span className="text-slate-700">Order Total</span> <span className="text-slate-900">₹{((selectedBillOrder.subtotal || 0) + (selectedBillOrder.tax || 0) + (selectedBillOrder.deliveryCharge || 0) - (selectedBillOrder.discount || 0)).toFixed(2)}</span></div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
                    <h4 className="font-semibold text-slate-700 mb-2 border-b border-slate-200 pb-2">Restaurant Payout & Expenses</h4>
                    <div className="flex justify-between py-1 text-sm"><span className="text-slate-500">Amount (excl. Customer Fees)</span> <span className="font-medium text-slate-900">₹{((selectedBillOrder.subtotal || 0) + (selectedBillOrder.tax || 0) - (selectedBillOrder.discount || 0)).toFixed(2)}</span></div>
                    
                    <div className="flex justify-between py-1 text-sm items-start">
                      <span className="text-red-500 flex flex-col">
                        <span>- Platform Fee</span>
                        {selectedBillOrder.restaurantPlatformFee > 0 ? (
                          <span className="text-xs text-slate-400 mt-0.5">
                            {selectedBillOrder.subtotal && selectedBillOrder.restaurantPlatformFee > 10 ? 
                              `₹10.00 Fixed + ${(((selectedBillOrder.restaurantPlatformFee - 10) / selectedBillOrder.subtotal) * 100).toFixed(1)}%` : 
                              'Fixed / Pre-calculated'}
                          </span>
                        ) : null}
                      </span> 
                      <span className="font-medium text-red-600">-₹{(selectedBillOrder.restaurantPlatformFee || 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between py-1 text-sm"><span className="text-red-500 truncate mr-2" title="- Coupon Expense (50% borne)">- Coupon (50% borne)</span> <span className="font-medium text-red-600 shrink-0">-₹{((selectedBillOrder.discount || 0) / 2).toFixed(2)}</span></div>
                    <div className="flex justify-between py-2 font-bold border-t border-slate-200 mt-2"><span className="text-slate-700">Net Order Profit</span> <span className="text-slate-900 shrink-0">₹{(((selectedBillOrder.subtotal || 0) + (selectedBillOrder.tax || 0) - (selectedBillOrder.discount || 0)) - (selectedBillOrder.restaurantPlatformFee || 0) - ((selectedBillOrder.discount || 0) / 2)).toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
