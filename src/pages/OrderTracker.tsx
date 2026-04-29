import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, ChefHat, Bike, Check, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingScreen } from '../components/Loader';

export function OrderTracker() {
  const { id } = useParams();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Pending');

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [restaurantEmail, setRestaurantEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch order');
        const data = await res.json();
        
        if (data.restaurantId && !restaurantEmail) {
           const restRes = await fetch(`/api/restaurants/${data.restaurantId}`);
           if (restRes.ok) {
             const restData = await restRes.json();
             if (isMounted) setRestaurantEmail(restData.email || 'support@foodbites.com');
           }
        }
        
        if (isMounted) {
          setOrder(data);
          setStatus(data.status || 'Pending');
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          restaurantId: order.restaurantId,
          orderId: order._id,
          customerId: order.customerId,
          customerName: order.customerInfo?.name || 'Anonymous',
          rating,
          comment
        })
      });
      if (res.ok) {
        setReviewSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to submit review');
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!order || error) return <div className="p-12 text-center text-red-500">Order not found</div>;

  const steps = [
    { id: 'Pending', label: 'Order Placed', icon: Clock },
    { id: 'Preparing', label: 'Preparing', icon: ChefHat },
    { id: 'On the way', label: 'On the way', icon: Bike },
    { id: 'Delivered', label: 'Delivered', icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
          <motion.div 
            className="h-full bg-brand-500"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(5, (currentStepIndex / (steps.length - 1)) * 100)}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        
        <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
          {(() => {
            const CurrentIcon = steps[currentStepIndex > -1 ? currentStepIndex : 0].icon;
            return <CurrentIcon className="w-10 h-10" />;
          })()}
        </div>
        
        <h1 className="font-sans text-3xl font-bold mb-2 text-slate-900">
          {status === 'Delivered' ? 'Order Complete!' : 'Preparing your order'}
        </h1>
        <p className="text-slate-500 mb-8 font-mono text-sm">Order ID: #{order._id}</p>

        <div className="flex flex-col gap-6 relative">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center gap-4 text-left relative">
                {index !== steps.length - 1 && (
                  <div className={`absolute top-10 left-6 w-0.5 h-full -ml-px ${isCompleted && index < currentStepIndex ? 'bg-brand-500' : 'bg-slate-200'}`} />
                )}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-colors duration-500 ${isCompleted ? 'bg-brand-500 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                   {isCompleted && index < currentStepIndex ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </h3>
                  {isCompleted && index === currentStepIndex && status !== 'Delivered' && (
                    <p className="text-brand-500 text-sm font-medium mt-1 animate-pulse">In progress...</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-4">Order Summary</h2>
        <div className="space-y-4 mb-6 pt-2">
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-slate-700">{item.quantity}x {item.name}</span>
              <span className="font-medium text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <div className="space-y-2 border-t pt-4 mt-4 text-sm">
          <div className="flex justify-between text-slate-600">
             <span>Subtotal</span>
             <span>₹{Number(order.subtotal || order.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0).toFixed(2)}</span>
          </div>
          {order.deliveryCharge > 0 && (
             <div className="flex justify-between text-slate-600">
               <span>Delivery Fee</span>
               <span>₹{Number(order.deliveryCharge).toFixed(2)}</span>
             </div>
          )}
          {order.platformFee > 0 && (
             <div className="flex justify-between text-slate-600">
               <span>Platform Fee</span>
               <span>₹{Number(order.platformFee).toFixed(2)}</span>
             </div>
          )}
          {order.discount > 0 && (
             <div className="flex justify-between text-green-600 font-medium">
               <span>Discount</span>
               <span>-₹{Number(order.discount).toFixed(2)}</span>
             </div>
          )}
          {order.tax > 0 && (
             <div className="flex justify-between text-slate-600">
               <span>Tax</span>
               <span>₹{Number(order.tax).toFixed(2)}</span>
             </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t text-slate-900 mt-2">
            <span>Total</span>
            <span>₹{Number(order.total || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
           <p className="text-sm text-slate-500 mb-2">Need help with your order?</p>
           <p className="text-sm font-medium text-brand-600">Contact Restaurant: <a href={`mailto:${restaurantEmail}`} className="hover:underline">{restaurantEmail || 'Loading...'}</a></p>
        </div>
      </div>

      {status === 'Delivered' && !order.hasReviewed && !reviewSubmitted && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-8"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-4 text-center">How was your food?</h2>
          <form onSubmit={submitReview} className="space-y-4">
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star className={`w-8 h-8 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Leave a review for the restaurant..."
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none min-h-[100px] resize-none"
              required
            ></textarea>
            <button 
              type="submit" 
              disabled={submittingReview}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </motion.div>
      )}

      {(reviewSubmitted || order.hasReviewed) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 p-6 rounded-xl border border-green-100 mb-8 text-center"
        >
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-green-800 font-bold text-lg mb-1">Thanks for your feedback!</h3>
          <p className="text-green-600 text-sm mb-4">Your review has been published.</p>
          {(order.review || (reviewSubmitted && rating)) && (
            <div className="bg-white p-4 rounded-lg inline-block text-left shadow-sm mt-2 w-full max-w-sm">
               <div className="flex justify-center gap-1 mb-2">
                 {[1, 2, 3, 4, 5].map((star) => (
                   <Star key={star} className={`w-5 h-5 ${(order.review?.rating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                 ))}
               </div>
               <p className="text-slate-700 text-sm text-center italic">"{order.review?.comment || comment}"</p>
            </div>
          )}
        </motion.div>
      )}

      <div className="text-center">
        <Link to="/" className="text-brand-500 font-medium hover:text-brand-600 transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
