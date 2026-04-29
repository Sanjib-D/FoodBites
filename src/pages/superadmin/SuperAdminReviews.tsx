import React, { useState, useEffect, useMemo } from 'react';
import { Star, Flag, Clock, Trash2, Store, Eye, X, Loader2 } from 'lucide-react';
import { InlineLoader, LoadingScreen } from '../../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

export function SuperAdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  const [globalFlaggedReviews, setGlobalFlaggedReviews] = useState<any[]>([]);
  const [showGlobalFlagged, setShowGlobalFlagged] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [restRes, revRes] = await Promise.all([
          fetch(`/api/restaurants`),
          fetch('/api/superadmin/reviews', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        const restData = restRes.ok ? await restRes.json() : [];
        const revData = revRes.ok ? await revRes.json() : [];
        
        if (isMounted) {
          setRestaurants(restData);
          setGlobalFlaggedReviews(revData.filter((r: any) => r.isFlagged));
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedRestId) return;
    let isMounted = true;
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/superadmin/reviews?restaurantId=${selectedRestId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch reviews');
        const data = await res.json();
        if (isMounted) {
          setReviews(data);
          setLoadingReviews(false);
        }
      } catch (err) {
        if (isMounted) setLoadingReviews(false);
      }
    };
    fetchReviews();
    return () => { isMounted = false; };
  }, [selectedRestId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review globally?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/superadmin/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReviews(reviews.filter(r => r._id !== id));
        setGlobalFlaggedReviews(prev => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      alert("Failed to delete review");
    }
  };

  const showOrderDetails = async (orderId: string) => {
    if (!orderId) return;
    setLoadingOrderId(orderId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!data.error) {
        setSelectedOrder(data);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Failed to load order details");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const filteredReviews = reviews;

  const stats = useMemo(() => {
    if (filteredReviews.length === 0) return { lifetime: 0, monthly: 0, weekly: 0 };
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyReviews = filteredReviews.filter(r => new Date(r.createdAt) >= oneWeekAgo);
    const monthlyReviews = filteredReviews.filter(r => new Date(r.createdAt) >= oneMonthAgo);

    const calcAvg = (arr: any[]) => arr.length ? arr.reduce((acc, r) => acc + (r.rating || 0), 0) / arr.length : 0;

    return {
      lifetime: calcAvg(filteredReviews),
      monthly: calcAvg(monthlyReviews),
      weekly: calcAvg(weeklyReviews)
    };
  }, [filteredReviews]);

  if (loading) return <LoadingScreen />;

  if (!selectedRestId) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-800"></div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Reviews Management</h2>
            <p className="text-slate-500">Select a restaurant to view or manage its reviews.</p>
          </div>
          <button 
            onClick={() => setShowGlobalFlagged(!showGlobalFlagged)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${showGlobalFlagged || globalFlaggedReviews.length > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'} shrink-0`}
          >
            <Flag className={`w-5 h-5 ${globalFlaggedReviews.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
            {showGlobalFlagged ? 'Hide Flagged' : `Flag Box (${globalFlaggedReviews.length})`}
          </button>
        </div>

        {showGlobalFlagged && (
          <div className="bg-red-50/50 p-6 rounded-2xl border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-4 space-y-4">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Flag className="w-5 h-5" /> Global Flagged Reviews
            </h3>
            {globalFlaggedReviews.length === 0 ? (
              <p className="text-slate-500">No flagged reviews across any restaurants.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {globalFlaggedReviews.map(review => (
                  <div key={review._id} className="p-4 bg-white rounded-xl border border-red-200 shadow-sm relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                    <div className="flex justify-between items-start mb-3 pl-2">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{review.customerName}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Store className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{restaurants.find(r => r._id === review.restaurantId)?.name || 'Restaurant'}</span>
                        </div>
                      </div>
                      <div className="flex bg-slate-50 px-2 py-1 rounded">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-800 text-sm font-medium bg-white p-3 rounded border border-red-100 ml-2 mb-4 flex-1 line-clamp-4">"{review.comment}"</p>
                    
                    <div className="flex justify-between pt-3 border-t border-red-100 mt-auto ml-2">
                      {review.orderId ? (
                        <button 
                          onClick={() => showOrderDetails(review.orderId)}
                          disabled={loadingOrderId === review.orderId}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {loadingOrderId === review.orderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                          {loadingOrderId === review.orderId ? 'Loading...' : 'Details'}
                        </button>
                      ) : (
                        <div></div>
                      )}
                      <button 
                        onClick={() => handleDelete(review._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg text-xs font-medium transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Global
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

  const flaggedReviews = filteredReviews.filter(r => r.isFlagged);
  const normalReviews = filteredReviews.filter(r => !r.isFlagged);
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
          <h2 className="text-2xl font-bold text-slate-800">{selectedRestName} Reviews</h2>
        </div>
      </div>

      {loadingReviews ? (
        <LoadingScreen />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
           <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Lifetime Avg</span>
           <div className="flex items-center gap-2">
             <Star className="w-8 h-8 fill-brand-500 text-brand-500" />
             <span className="text-4xl font-black text-slate-800">{stats.lifetime.toFixed(1)}</span>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
           <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Monthly Avg</span>
           <div className="flex items-center gap-2">
             <Star className="w-8 h-8 fill-brand-500 text-brand-500" />
             <span className="text-4xl font-black text-slate-800">{stats.monthly.toFixed(1)}</span>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
           <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Weekly Avg</span>
           <div className="flex items-center gap-2">
             <Star className="w-8 h-8 fill-brand-500 text-brand-500" />
             <span className="text-4xl font-black text-slate-800">{stats.weekly.toFixed(1)}</span>
           </div>
        </div>
      </div>
      
      {flaggedReviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
            <Flag className="w-5 h-5" /> Flagged Reviews (Needs Attention)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flaggedReviews.map(review => (
              <div key={review._id} className="p-4 bg-red-50/30 rounded-xl border border-red-200 shadow-sm relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                <div className="flex justify-between items-start mb-3 pl-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{review.customerName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-slate-800 text-sm font-medium bg-white p-3 rounded border border-red-100 ml-2 mb-4 flex-1 line-clamp-4">"{review.comment}"</p>
                
                <div className="flex justify-between pt-3 border-t border-red-100 mt-auto ml-2">
                  {review.orderId ? (
                    <button 
                      onClick={() => showOrderDetails(review.orderId)}
                      disabled={loadingOrderId === review.orderId}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {loadingOrderId === review.orderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      {loadingOrderId === review.orderId ? 'Loading...' : 'Details'}
                    </button>
                  ) : (
                    <div></div>
                  )}
                  <button 
                    onClick={() => handleDelete(review._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700">All Reviews</h3>
        {normalReviews.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">No normal reviews.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {normalReviews.map(review => (
              <div key={review._id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{review.customerName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4 flex-1 line-clamp-4">{review.comment}</p>
                
                <div className="flex justify-between pt-3 border-t border-slate-100 mt-auto">
                  {review.orderId ? (
                    <button 
                      onClick={() => showOrderDetails(review.orderId)}
                      disabled={loadingOrderId === review.orderId}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {loadingOrderId === review.orderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      {loadingOrderId === review.orderId ? 'Loading...' : 'Details'}
                    </button>
                  ) : (
                    <div></div>
                  )}
                  <button 
                    onClick={() => handleDelete(review._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {flaggedReviews.length === 0 && normalReviews.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No reviews yet</h3>
          <p className="text-slate-500">This restaurant hasn't received any reviews.</p>
        </div>
      )}
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
