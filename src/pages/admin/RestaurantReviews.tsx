import React, { useState, useEffect } from 'react';
import { Star, Flag, Clock, Eye, X, Loader2 } from 'lucide-react';
import { InlineLoader, LoadingScreen } from '../../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

export function RestaurantReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      const restId = localStorage.getItem('restaurantId') || '1';
      try {
        const res = await fetch(`/api/restaurants/${restId}/reviews`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (isMounted) {
          setReviews(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };
    fetchReviews();
    return () => { isMounted = false; };
  }, []);

  const [confirmFlagId, setConfirmFlagId] = useState<string | null>(null);

  const handleFlagReview = async (reviewId: string) => {
    try {
      const restId = localStorage.getItem('restaurantId') || '1';
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/restaurants/${restId}/reviews/${reviewId}/flag`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(reviews.map(r => r._id === reviewId ? { ...r, isFlagged: true } : r));
        setConfirmFlagId(null);
      } else {
        console.error(data.error);
        setConfirmFlagId(null);
      }
    } catch (err) {
      console.error(err);
      setConfirmFlagId(null);
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

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Customer Reviews</h2>
      
      {reviews.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">No reviews received yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map(review => (
            <div key={review._id} className={`relative p-4 bg-white rounded-xl border ${review.isFlagged ? 'border-red-200 bg-red-50' : 'border-slate-200'} shadow-sm flex flex-col overflow-hidden`}>
              {review.isFlagged && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
              <div className={`flex justify-between items-start mb-3 ${review.isFlagged ? 'pl-2' : ''}`}>
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
              <p className={`text-slate-700 text-sm leading-relaxed mb-4 flex-1 line-clamp-4 ${review.isFlagged ? 'pl-2' : ''}`}>{review.comment}</p>
              
              <div className={`flex justify-between pt-3 border-t mt-auto ${review.isFlagged ? 'border-red-100 pl-2' : 'border-slate-100'}`}>
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
                {confirmFlagId === review._id ? (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleFlagReview(review._id)}
                      className="px-2 py-1.5 bg-red-500 text-white hover:bg-red-600 rounded text-xs font-medium transition-colors"
                    >
                      Confirm Flag
                    </button>
                    <button 
                      onClick={() => setConfirmFlagId(null)}
                      className="px-2 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmFlagId(review._id)}
                    disabled={review.isFlagged}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${review.isFlagged ? 'bg-red-500 text-white shadow-sm cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-500'}`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    {review.isFlagged ? 'Flagged' : 'Flag'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            key="order-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              key="order-modal-content"
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
                  <div className="w-full md:w-[350px] space-y-4">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
                      <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs border-b pb-2 mb-2 border-slate-200">Customer Receipt</h4>
                      <div className="flex justify-between py-1 text-sm"><span className="text-slate-500">Subtotal</span> <span className="font-medium text-slate-900">₹{(selectedOrder.subtotal || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between py-1 text-sm"><span className="text-slate-500">Delivery Charge</span> <span className="font-medium text-slate-900">₹{(selectedOrder.deliveryCharge || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between py-1 text-sm"><span className="text-slate-500">Tax</span> <span className="font-medium text-slate-900">₹{(selectedOrder.tax || 0).toFixed(2)}</span></div>
                      {selectedOrder.discount > 0 && <div className="flex justify-between py-1 text-sm"><span className="text-slate-500">Discount</span> <span className="font-medium text-green-600">-₹{(selectedOrder.discount).toFixed(2)}</span></div>}
                      <div className="flex justify-between py-2 font-bold border-t border-slate-200 mt-2"><span className="text-slate-700">Order Total</span> <span className="text-slate-900">₹{((selectedOrder.subtotal || 0) + (selectedOrder.tax || 0) + (selectedOrder.deliveryCharge || 0) - (selectedOrder.discount || 0)).toFixed(2)}</span></div>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
                      <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-xs border-b pb-2 mb-2 border-slate-200">Restaurant Payout & Expenses</h4>
                      <div className="flex justify-between py-1 text-sm"><span className="text-slate-500">Amount (excl. Customer Fees)</span> <span className="font-medium text-slate-900">₹{((selectedOrder.subtotal || 0) + (selectedOrder.tax || 0) - (selectedOrder.discount || 0)).toFixed(2)}</span></div>
                      
                      <div className="flex justify-between py-1 text-sm items-start">
                        <span className="text-red-500 flex flex-col">
                          <span>- Platform Fee</span>
                          {selectedOrder.restaurantPlatformFee > 0 ? (
                            <span className="text-xs text-slate-400 mt-0.5">
                              {selectedOrder.subtotal && selectedOrder.restaurantPlatformFee > 10 ? 
                                `₹10.00 Fixed + ${(((selectedOrder.restaurantPlatformFee - 10) / selectedOrder.subtotal) * 100).toFixed(1)}%` : 
                                'Fixed / Pre-calculated'}
                            </span>
                          ) : null}
                        </span> 
                        <span className="font-medium text-red-600">-₹{(selectedOrder.restaurantPlatformFee || 0).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between py-1 text-sm"><span className="text-red-500 truncate mr-2" title="- Coupon Expense (50% borne)">- Coupon (50% borne)</span> <span className="font-medium text-red-600 shrink-0">-₹{((selectedOrder.discount || 0) / 2).toFixed(2)}</span></div>
                      <div className="flex justify-between py-2 font-bold border-t border-slate-200 mt-2"><span className="text-slate-700">Net Order Profit</span> <span className="text-slate-900 shrink-0">₹{(((selectedOrder.subtotal || 0) + (selectedOrder.tax || 0) - (selectedOrder.discount || 0)) - (selectedOrder.restaurantPlatformFee || 0) - ((selectedOrder.discount || 0) / 2)).toFixed(2)}</span></div>
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
