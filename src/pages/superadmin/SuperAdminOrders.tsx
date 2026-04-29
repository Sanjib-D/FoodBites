import React, { useState, useEffect, useMemo } from 'react';
import { Star, Clock, Store, Eye, X, Receipt, ShoppingBag, Banknote, Percent } from 'lucide-react';
import { LoadingScreen } from '../../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

export function SuperAdminOrders() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`/api/restaurants`);
        const data = res.ok ? await res.json() : [];
        if (isMounted) {
          setRestaurants(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };
    fetchRestaurants();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedRestId) return;
    let isMounted = true;
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/admin/orders?restaurantId=${selectedRestId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        if (isMounted) {
          setOrders(data);
          setLoadingOrders(false);
        }
      } catch (err) {
        if (isMounted) setLoadingOrders(false);
      }
    };
    fetchOrders();
    return () => { isMounted = false; };
  }, [selectedRestId]);

  const stats = useMemo(() => {
    if (orders.length === 0) return { totalRevenue: 0, platformFees: 0, tax: 0, orderCount: 0 };
    
    return orders.reduce((acc, order) => {
      acc.totalRevenue += (order.subtotal || 0);
      acc.platformFees += (order.restaurantPlatformFee || 0);
      acc.tax += (order.tax || 0);
      acc.orderCount += 1;
      return acc;
    }, { totalRevenue: 0, platformFees: 0, tax: 0, orderCount: 0 });
  }, [orders]);

  if (loading) return <LoadingScreen />;

  if (!selectedRestId) {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-slate-800">Select a Restaurant to View Orders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map(rest => (
            <div 
              key={rest._id}
              onClick={() => setSelectedRestId(rest._id)}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-brand-300 transition-all flex flex-col items-center justify-center text-center gap-3 group"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                <Store className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{rest.name}</h3>
                <p className="text-sm text-slate-500">{rest.address ? rest.address : 'Address not provided'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const selectedRestName = restaurants.find(r => r._id === selectedRestId)?.name || 'Restaurant';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedRestId(null)}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
            title="Back to all restaurants"
          >
            &larr;
          </button>
          <h2 className="text-2xl font-bold text-slate-800">{selectedRestName} Orders</h2>
        </div>
      </div>

      {loadingOrders ? (
        <LoadingScreen />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Revenue</span>
              <div className="flex items-center gap-2">
                <Banknote className="w-6 h-6 text-brand-500" />
                <span className="text-3xl font-black text-slate-800">₹{stats.totalRevenue.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Orders Completed</span>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-brand-500" />
                <span className="text-3xl font-black text-slate-800">{stats.orderCount}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Platform Fees Ded.</span>
              <div className="flex items-center gap-2">
                <Banknote className="w-6 h-6 text-red-500" />
                <span className="text-3xl font-black text-red-600">₹{stats.platformFees.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Gross Earnings</span>
              <div className="flex items-center gap-2">
                <Receipt className="w-6 h-6 text-green-500" />
                <span className="text-3xl font-black text-green-600">₹{(stats.totalRevenue - stats.platformFees).toFixed(2)}</span>
              </div>
            </div>
          </div>
      
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-700">Order History</h3>
            {orders.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                <p className="text-slate-500">No orders placed yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map(order => (
                  <div key={order._id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Order #{order._id?.substring(0, 6).toUpperCase()}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider
                        ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-brand-100 text-brand-700'}`}>
                        {order.status || 'Pending'}
                      </span>
                    </div>
                    
                    <div className="flex-1 my-2">
                      <div className="text-sm text-slate-600 mb-2 font-medium">Customer: {order.customerInfo?.name || 'Guest'}</div>
                      <div className="text-xs text-slate-500 space-y-1">
                        {order.items?.slice(0, 2).map((item: any, i: number) => (
                          <div key={i} className="flex justify-between">
                            <span className="truncate pr-2">{item.quantity}x {item.name}</span>
                            <span className="font-medium shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        {(order.items?.length || 0) > 2 && (
                          <div className="text-slate-400 italic">+{order.items.length - 2} more items</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                      <div className="font-bold text-slate-800">
                        ₹{(order.total || 0).toFixed(2)}
                      </div>
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <AnimatePresence>
        {selectedOrder && (
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
                <h3 className="font-bold text-slate-800 text-lg">Order Details</h3>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs border-b pb-2">Items</h4>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600"><span className="font-medium text-slate-800">{item.quantity}x</span> {item.name}</span>
                          <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full md:w-80 bg-slate-50 p-5 rounded-xl border border-slate-100 self-start space-y-4">
                    <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs border-b pb-2">Order Financials</h4>

                    <div className="space-y-2 text-sm">
                      <div className="font-semibold text-slate-800">Customer</div>
                      <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">₹{(selectedOrder.subtotal || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="font-medium">₹{(selectedOrder.tax || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Delivery Charge</span><span className="font-medium">₹{(selectedOrder.deliveryCharge || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Platform Fee</span><span className="font-medium">₹{(selectedOrder.platformFee || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-medium text-green-600">-₹{(selectedOrder.discount || 0).toFixed(2)}</span></div>
                      <div className="border-t border-slate-200 mt-1 pt-1 flex items-center justify-between font-bold">
                        <span className="text-slate-800">Total Customer Paid</span>
                        <span className="text-brand-600">₹{(selectedOrder.total || ((selectedOrder.subtotal || 0) + (selectedOrder.tax || 0) + (selectedOrder.deliveryCharge || 0) + (selectedOrder.platformFee || 0) - (selectedOrder.discount || 0))).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm pt-2 border-t border-slate-200">
                      <div className="font-semibold text-slate-800">Restaurant</div>
                      <div className="flex justify-between"><span className="text-slate-500">Gross Earnings</span><span className="font-medium">₹{((selectedOrder.subtotal || 0) + (selectedOrder.tax || 0) - (selectedOrder.discount || 0)/2).toFixed(2)}</span></div>
                      <div className="flex justify-between py-1 text-sm items-start">
                        <span className="text-slate-500 flex flex-col">
                          <span>Platform Fees Paid</span>
                          {selectedOrder.restaurantPlatformFee > 0 ? (
                            <span className="text-xs text-slate-400 mt-0.5">
                              {selectedOrder.subtotal && selectedOrder.restaurantPlatformFee > 10 ? 
                                `₹10.00 Fixed + ${(((selectedOrder.restaurantPlatformFee - 10) / selectedOrder.subtotal) * 100).toFixed(1)}%` : 
                                'Fixed / Pre-calculated'}
                            </span>
                          ) : null}
                        </span> 
                        <span className="font-medium text-red-500">-₹{(selectedOrder.restaurantPlatformFee || 0).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-slate-200 mt-1 pt-1 flex items-center justify-between font-bold">
                        <span className="text-slate-800">Gross Profit</span>
                        <span className="text-blue-600">₹{((selectedOrder.subtotal || 0) + (selectedOrder.tax || 0) - (selectedOrder.discount || 0)/2 - (selectedOrder.restaurantPlatformFee || 0)).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm pt-2 border-t border-slate-200">
                      <div className="font-semibold text-slate-800">Our Platform Profit</div>
                      <div className="flex justify-between"><span className="text-slate-500">From Customer (Platform Fee)</span><span className="font-medium">₹{(selectedOrder.platformFee || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">From Restaurant</span><span className="font-medium">₹{(selectedOrder.restaurantPlatformFee || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-red-500">- Coupon Expense (50% borne)</span><span className="font-medium text-red-600">-₹{((selectedOrder.discount || 0) / 2).toFixed(2)}</span></div>
                      <div className="border-t border-slate-200 mt-1 pt-1 flex items-center justify-between font-bold">
                        <span className="text-slate-800">Total Profit</span>
                        <span className="text-green-600">₹{((selectedOrder.platformFee || 0) + (selectedOrder.restaurantPlatformFee || 0) - ((selectedOrder.discount || 0) / 2)).toFixed(2)}</span>
                      </div>
                    </div>
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
