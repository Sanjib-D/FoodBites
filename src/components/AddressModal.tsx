import React, { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function AddressModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { customer, updateCustomer } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ addressLine: '', phone: '', tag: 'Home' });
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const addresses = customer?.addresses || [];

  const saveAddressesToApi = async (updatedAddresses: any[]) => {
    if (!customer) throw new Error("No customer logged in");
    const res = await fetch(`/api/customers/${customer._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...customer, addresses: updatedAddresses })
    });
    const data = await res.json();
    if (data.success) {
      updateCustomer(data.customer);
    } else {
      throw new Error(data.error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.addressLine.trim()) return;

    const addressObj = {
      formatted: formData.addressLine,
      phone: formData.phone,
      tag: formData.tag || 'Home'
    };

    try {
      if (editIndex !== null) {
        const updated = [...addresses];
        updated[editIndex] = addressObj;
        await saveAddressesToApi(updated);
      } else {
        await saveAddressesToApi([...addresses, addressObj]);
      }
      setShowForm(false);
      setFormData({ addressLine: '', phone: '', tag: 'Home' });
      setEditIndex(null);
    } catch (err) {
      alert("Failed to save address");
    }
  };

  const removeAddress = async (index: number) => {
    if (confirm("Remove this address?")) {
      try {
        const updated = addresses.filter((_: any, i: number) => i !== index);
        await saveAddressesToApi(updated);
      } catch (err) {
         alert("Failed to remove address");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {showForm ? (editIndex !== null ? 'Edit Address' : 'Add New Address') : 'Select Delivery Address'}
          </h2>
          <button onClick={() => {
            if (showForm) {
              setShowForm(false);
              setFormData({ addressLine: '', phone: '' });
              setEditIndex(null);
            } else {
              onClose();
            }
          }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {!customer ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">Please log in to manage your addresses.</p>
              <button onClick={() => { onClose(); navigate('/login'); }} className="px-6 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600">
                Log In
              </button>
            </div>
          ) : showForm ? (
             <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Save As</label>
                  <div className="flex gap-2 mb-4">
                    {['Home', 'Office', 'Other'].map(tag => (
                      <label key={tag} className={`flex-1 text-center py-2 border rounded-xl cursor-pointer text-sm font-medium transition-colors ${formData.tag === tag ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        <input type="radio" name="addressTag" value={tag} checked={formData.tag === tag} onChange={e => setFormData({...formData, tag: e.target.value})} className="hidden" />
                        {tag}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address Details</label>
                  <textarea 
                    required 
                    rows={3}
                    value={formData.addressLine}
                    onChange={e => setFormData({...formData, addressLine: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none" 
                    placeholder="House/Flat No., Road, Landmark" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                    placeholder="10-digit mobile number" 
                  />
                </div>
                <button type="submit" className="w-full bg-brand-500 text-white py-3 rounded-xl font-bold hover:bg-brand-600 transition-colors">
                  Save Address
                </button>
             </form>
          ) : (
             <div className="space-y-3">
                <button 
                  onClick={() => {
                    setFormData({ addressLine: '', phone: '', tag: 'Home' });
                    setEditIndex(null);
                    setShowForm(true);
                  }}
                  className="w-full flex items-center justify-between p-4 border border-brand-200 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors"
                >
                  <span className="font-semibold text-brand-700 flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add New Address
                  </span>
                </button>
                {addresses.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    No saved addresses found.
                  </div>
                ) : (
                  addresses.map((addr: any, i: number) => {
                    const isObject = typeof addr === 'object' && addr !== null;
                    const displayAddr = isObject ? addr.formatted : addr;
                    const addrPhone = isObject ? addr.phone : '';
                    const addrTag = isObject && addr.tag ? addr.tag : `Address ${i + 1}`;
                    return (
                      <div 
                        key={i} 
                        onClick={async () => {
                           if (i === 0) return; // already primary
                           const updated = [...addresses];
                           const [moved] = updated.splice(i, 1);
                           updated.unshift(moved);
                           try { await saveAddressesToApi(updated); onClose(); } catch(err){}
                        }}
                        className={`flex gap-3 p-4 border rounded-xl transition-all group relative cursor-pointer ${i === 0 ? 'border-brand-500 bg-brand-50/20 shadow-sm ring-1 ring-brand-500' : 'border-slate-200 hover:border-brand-300 hover:shadow-sm'}`}
                      >
                        <MapPin className={`w-5 h-5 shrink-0 mt-0.5 ${i === 0 ? 'text-brand-500' : 'text-slate-400 group-hover:text-brand-400'}`} />
                        <div className="flex-1 text-left">
                          <p className="font-medium text-slate-900 mb-1">{addrTag}</p>
                          <p className="text-sm text-slate-600 leading-relaxed mb-1">{displayAddr}</p>
                          {addrPhone && <p className="text-xs text-slate-500 font-medium">📞 +{addrPhone}</p>}
                        </div>
                        {i === 0 && <span className="absolute bottom-4 right-4 text-[10px] uppercase font-bold text-brand-500 bg-brand-100 px-2 flex items-center h-5 rounded shadow-sm">Deliver Here</span>}
                        {i !== 0 && (
                          <span className="absolute bottom-4 right-4 text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 flex items-center h-5 rounded transition-all opacity-0 group-hover:opacity-100 group-hover:text-brand-600 group-hover:bg-brand-50">
                             Select
                          </span>
                        )}
                        <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                          <button onClick={(e) => {
                             e.stopPropagation();
                             setEditIndex(i);
                             setFormData({ addressLine: displayAddr, phone: addrPhone, tag: isObject && addr.tag ? addr.tag : 'Home' });
                             setShowForm(true);
                          }} className="p-2 bg-white rounded-full shadow-sm text-brand-600 hover:bg-brand-50 hover:text-brand-700 border border-slate-100">
                             <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => {
                             e.stopPropagation();
                             removeAddress(i);
                          }} className="p-2 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50 hover:text-red-700 border border-slate-100">
                             <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
