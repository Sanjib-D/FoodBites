import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Check, ArrowRight, MapPin, Tag, Plus } from 'lucide-react';

export function Checkout() {
  const { items, total, clearCart } = useCart();
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    addressText: '' // For new address
  });

  // Coupons & Pricing
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: 'fixed' | 'percentage' } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('COD');
  const [showDummyGateway, setShowDummyGateway] = useState(false);

  // Fixed charges
  const [deliveryCharge, setDeliveryCharge] = useState(40);
  const [serviceCharge, setServiceCharge] = useState(25);
  const [taxRate, setTaxRate] = useState(5);

  useEffect(() => {
    if (!customer) {
      navigate('/login?redirect=/checkout');
    }
  }, [customer, navigate]);

  useEffect(() => {
    // Fetch settings for charges
    fetch('/api/superadmin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.deliveryCharge !== undefined) setDeliveryCharge(data.deliveryCharge);
        if (data.platformFee !== undefined) setServiceCharge(data.platformFee);
        if (data.taxRate !== undefined) setTaxRate(data.taxRate);
      })
      .catch(err => console.error("Could not fetch settings", err));
  }, []);

  useEffect(() => {
    if (customer) {
      const firstAddr = customer.addresses?.length ? customer.addresses[0] : null;
      const initialAddress = firstAddr ? (typeof firstAddr === 'object' ? firstAddr.formatted : firstAddr) : 'new';
      setFormData(prev => ({
        ...prev,
        name: customer.name || '',
        address: initialAddress,
        addressText: customer.address || '',
        phone: customer.phone || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        address: 'new'
      }));
    }
  }, [customer]);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">Your cart is empty</h2>
        <button onClick={() => navigate('/')} className="text-brand-500 font-medium hover:text-brand-600 transition-colors">Return to Home</button>
      </div>
    );
  }

  // Calculate totals
  const subtotal = total;
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = subtotal * (appliedCoupon.discount / 100);
    } else {
      discountAmount = appliedCoupon.discount;
    }
  }
  const taxAmount = Math.max(0, (subtotal - discountAmount) * (taxRate / 100));
  const finalTotal = subtotal + deliveryCharge + serviceCharge + taxAmount - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError('');
    
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode })
      });
      const data = await res.json();
      
      if (data.success && data.coupon) {
        setAppliedCoupon({ 
          code: data.coupon.code, 
          discount: data.coupon.discount, 
          type: data.coupon.type 
        });
      } else {
        setAppliedCoupon(null);
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch (err) {
      setCouponError('Failed to validate coupon');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.address === 'new' && !formData.addressText.trim()) {
      return alert("Please enter a delivery address");
    }
    if (!formData.address && formData.address !== 'new') {
      return alert("Please select or enter a delivery address");
    }
    if (paymentMethod === 'Online') {
      setShowDummyGateway(true);
    } else {
      await placeOrderBackend();
    }
  };

  const placeOrderBackend = async () => {
    setLoading(true);
    const finalAddress = formData.address === 'new' ? formData.addressText : formData.address;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items,
          total: finalTotal, // Use calculated final total
          subtotal,
          deliveryCharge,
          platformFee: serviceCharge,
          tax: taxAmount,
          discount: appliedCoupon ? discountAmount : 0,
          customerInfo: { ...formData, address: finalAddress },
          paymentMethod,
          customerId: customer?._id || null
        })
      });
      const data = await res.json();
      
      if (data.success) {
        clearCart();
        navigate(`/order/${data.order._id}`);
      } else {
        alert(data.error || 'Failed to place order (Server Error)');
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to place order: ' + err.message);
    } finally {
      setLoading(false);
      setShowDummyGateway(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 bg-slate-50 min-h-screen">
      <h1 className="font-sans text-3xl font-bold mb-8 text-slate-900 tracking-tight">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-lg text-slate-800">Delivery Details</h2>
            </div>
            <div className="p-6">
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400" 
                    placeholder="John Doe" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Delivery Address</label>
                  {customer?.addresses?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {customer.addresses.map((addr, i) => {
                        const isObject = typeof addr === 'object' && addr !== null;
                        const displayAddr = isObject ? addr.formatted : addr;
                        const addrPhone = isObject ? addr.phone : '';
                        
                        return (
                          <label 
                            key={i} 
                            className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:bg-slate-50
                              ${formData.address === displayAddr ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/20' : 'border-slate-200 bg-white'}`}
                          >
                            <input 
                              type="radio" 
                              name="address_selection" 
                              value={displayAddr} 
                              checked={formData.address === displayAddr}
                              onChange={() => {
                                setFormData({
                                  ...formData, 
                                  address: displayAddr,
                                  phone: addrPhone || formData.phone // Update phone if address has one
                                });
                              }}
                              className="sr-only"
                            />
                            <div className="flex w-full items-start justify-between">
                              <div className="flex items-start gap-3">
                                <MapPin className={`w-5 h-5 shrink-0 mt-0.5 ${formData.address === displayAddr ? 'text-brand-500' : 'text-slate-400'}`} />
                                <div className="text-sm">
                                  <p className="font-medium text-slate-900 mb-1">Address {i + 1}</p>
                                  <p className="text-slate-500 line-clamp-3">{displayAddr}</p>
                                  {addrPhone && <p className="text-slate-400 mt-1 flex items-center gap-1 text-xs">📞 +{addrPhone}</p>}
                                </div>
                              </div>
                              {formData.address === displayAddr && <Check className="w-5 h-5 text-brand-500 shrink-0" />}
                            </div>
                          </label>
                        );
                      })}
                      
                      <label 
                        className={`relative flex cursor-pointer rounded-xl border border-dashed p-4 transition-all hover:bg-slate-50
                          ${formData.address === 'new' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-300 bg-white items-center justify-center'}`}
                      >
                        <input 
                          type="radio" 
                          name="address_selection" 
                          value="new" 
                          checked={formData.address === 'new'}
                          onChange={() => setFormData({...formData, address: 'new'})}
                          className="sr-only"
                        />
                        {formData.address === 'new' ? (
                          <div className="w-full">
                            <p className="font-medium text-slate-900 mb-2 text-sm flex items-center gap-2">
                              <Plus className="w-4 h-4 text-brand-500"/> New Address
                            </p>
                            <textarea 
                              required 
                              value={formData.addressText}
                              onChange={e => setFormData({...formData, addressText: e.target.value})}
                              className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none h-20" 
                              placeholder="House/Flat No., Road, Landmark" 
                            />
                          </div>
                        ) : (
                          <div className="text-center text-slate-500 flex flex-col items-center gap-1.5">
                            <Plus className="w-5 h-5 mx-auto" />
                            <span className="text-sm font-medium">Add New Address</span>
                          </div>
                        )}
                      </label>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <textarea 
                        required 
                        value={formData.addressText}
                        onChange={e => setFormData({...formData, addressText: e.target.value, address: 'new'})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none h-24" 
                        placeholder="House/Flat No., Road, Landmark" 
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                  <input 
                    required 
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400" 
                    placeholder="+91 98765 43210" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Payment Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`cursor-pointer border p-4 rounded-xl flex items-center gap-3 transition-colors ${paymentMethod === 'COD' ? 'border-brand-500 bg-brand-50 border-2' : 'border-slate-200 hover:border-brand-300'}`}>
                      <input 
                        type="radio" 
                        name="payment_method" 
                        value="COD" 
                        checked={paymentMethod === 'COD'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'COD')}
                        className="w-4 h-4 text-brand-500"
                      />
                      <span className="font-medium text-slate-800">Cash on Delivery</span>
                    </label>
                    <label className={`cursor-pointer border p-4 rounded-xl flex items-center gap-3 transition-colors ${paymentMethod === 'Online' ? 'border-brand-500 bg-brand-50 border-2' : 'border-slate-200 hover:border-brand-300'}`}>
                      <input 
                        type="radio" 
                        name="payment_method" 
                        value="Online" 
                        checked={paymentMethod === 'Online'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'Online')}
                        className="w-4 h-4 text-brand-500"
                      />
                      <span className="font-medium text-slate-800">Pay Online</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-lg text-slate-800">Order Summary</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="max-h-60 overflow-y-auto pr-2 space-y-4 mb-2">
                {items.map(item => (
                  <div key={item._id} className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {item.quantity}x
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 pr-2 line-clamp-2 leading-tight">{item.name}</p>
                        <p className="text-xs text-slate-500 mt-1">₹{Number(item.price || 0).toFixed(2)} each</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">₹{(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      disabled={!!appliedCoupon}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter Coupon Code" 
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 outline-none uppercase disabled:opacity-60" 
                    />
                  </div>
                  {appliedCoupon ? (
                    <button onClick={handleRemoveCoupon} className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors">
                      Remove
                    </button>
                  ) : (
                    <button onClick={handleApplyCoupon} className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
                      Apply
                    </button>
                  )}
                </div>
                {couponError && <p className="text-red-500 text-xs font-medium mb-3 pl-1">{couponError}</p>}
                {appliedCoupon && <p className="text-green-600 text-xs font-medium mb-3 pl-1">Coupon '{appliedCoupon.code}' applied successfully!</p>}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Item Total</span>
                  <span className="font-medium text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>- ₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-slate-900">₹{deliveryCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Platform Fee</span>
                  <span className="font-medium text-slate-900">₹{serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Taxes ({taxRate}%)</span>
                  <span className="font-medium text-slate-900">₹{taxAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4 flex justify-between items-center">
                <span className="font-bold text-lg text-slate-900">To Pay</span>
                <span className="font-sans font-black text-2xl text-brand-600">₹{finalTotal.toFixed(2)}</span>
              </div>

              <button 
                type="submit" 
                form="checkout-form"
                disabled={loading}
                className="w-full mt-6 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
              >
                {loading ? 'Processing...' : 'Place Order securely'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
            <div className="bg-slate-100 py-3 px-6 text-center text-xs text-slate-500">
              By placing your order, you agree to our Terms of Use.
            </div>
          </div>
        </div>
      </div>

      {showDummyGateway && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center transform shadow-[0_0_40px_rgba(0,0,0,0.1)] items-center flex flex-col">
            <div className="w-20 h-20 bg-brand-100 text-brand-500 rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Secure Payment</h2>
            <p className="text-slate-500 mb-6 text-sm">For Demo Purpose Only. This is a simulated payment gateway.</p>
            <div className="bg-slate-50 p-4 rounded-xl mb-8 w-full text-left">
              <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">Amount:</span> <span className="font-bold text-slate-800">₹{finalTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Merchant:</span> <span className="font-bold text-slate-800">Foodbite</span></div>
            </div>
            <div className="flex items-center gap-4 w-full">
              <button 
                onClick={() => setShowDummyGateway(false)} 
                className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
              >
                Reject
              </button>
              <button 
                onClick={() => placeOrderBackend()} 
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
