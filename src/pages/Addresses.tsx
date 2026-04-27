import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Plus, Trash2, Edit2 } from 'lucide-react';

export function Addresses() {
  const { customer, updateCustomer } = useAuth();
  
  const [houseNo, setHouseNo] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Addresses can be old strings or new objects.
  const addresses = customer?.addresses || [];

  const startEdit = (index: number) => {
    const addr = addresses[index];
    if (typeof addr === 'object' && addr !== null) {
      setHouseNo(addr.houseNo || '');
      setCity(addr.city || '');
      setCountry(addr.country || '');
      setPincode(addr.pincode || '');
      setPhone(addr.phone || '');
    } else {
      setHouseNo(addr || '');
      setCity('');
      setCountry('');
      setPincode('');
      setPhone('');
    }
    setEditIndex(index);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setHouseNo(''); setCity(''); setCountry(''); setPincode(''); setPhone('');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseNo.trim() || !city.trim() || !country.trim() || !pincode.trim() || !phone.trim()) return;
    setLoading(true);
    
    const addressObj = {
      houseNo: houseNo.trim(),
      city: city.trim(),
      country: country.trim(),
      pincode: pincode.trim(),
      phone: phone.trim(),
      formatted: `${houseNo.trim()}, ${city.trim()}, ${country.trim()} - ${pincode.trim()}`
    };

    try {
      if (editIndex !== null) {
        const updated = [...addresses];
        updated[editIndex] = addressObj;
        await updateCustomer({ addresses: updated });
        setEditIndex(null);
      } else {
        await updateCustomer({
          addresses: [...addresses, addressObj]
        });
      }
      setHouseNo(''); setCity(''); setCountry(''); setPincode(''); setPhone('');
    } catch (err) {
      alert("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (index: number) => {
    setLoading(true);
    try {
      const updated = addresses.filter((_: any, i: number) => i !== index);
      await updateCustomer({ addresses: updated });
    } catch (err) {
      alert("Failed to remove address");
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return <div className="p-8 text-center text-slate-500">Please log in to manage addresses.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">My Addresses</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-6">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">House No. / Flat / Building</label>
                <input required value={houseNo} onChange={(e) => setHouseNo(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input required value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                <input required value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                <input required value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number (For Delivery)</label>
                <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                type="submit" 
                disabled={loading || !houseNo.trim()}
                className="mt-4 px-6 py-3 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
              >
                {editIndex !== null ? 'Update Address' : <><Plus className="w-5 h-5" /> Add Address</>}
              </button>
              {editIndex !== null && (
                <button 
                  type="button"
                  onClick={cancelEdit}
                  disabled={loading}
                  className="mt-4 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-500">
            No saved addresses. Add one above to checkout faster!
          </div>
        ) : (
          addresses.map((addr: any, i: number) => {
            const isObject = typeof addr === 'object' && addr !== null;
            const displayAddress = isObject ? addr.formatted : addr;
            
            return (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-brand-500" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-800 leading-relaxed font-medium">{displayAddress}</p>
                  {isObject && addr.phone && (
                    <p className="text-sm text-slate-500 mt-1">Phone: +{addr.phone}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => startEdit(i)}
                    disabled={loading}
                    className="p-2 text-blue-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleRemove(i)}
                    disabled={loading}
                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
