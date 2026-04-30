import React, { useEffect, useState } from 'react';
import { Trash2, Edit, Plus, X } from 'lucide-react';
import { InlineLoader } from '../../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

export function MenuManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Mains',
    customCategory: '',
    restaurantId: '1' // Default demo ID
  });

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/admin/menu', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setItems(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleDelete = async (id: string) => {
    if(!confirm('Are you sure?')) return;
    try {
      await fetch(`/api/admin/menu/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchMenu();
    } catch(err) {
      console.error(err);
    }
  };

  const handleEdit = (item: any) => {
    const isStandardCategory = ['Starters', 'Mains', 'Sides', 'Desserts', 'Drinks'].includes(item.category);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: isStandardCategory ? item.category : 'Other',
      customCategory: isStandardCategory ? '' : item.category,
      restaurantId: item.restaurantId || '1'
    });
    setEditId(item._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const finalCategory = formData.category === 'Other' ? formData.customCategory.trim() : formData.category;
    
    if (formData.category === 'Other' && !finalCategory) {
      alert("Please specify the custom category name.");
      setSaving(false);
      return;
    }

    const payload = {
       ...formData,
       category: finalCategory,
       price: parseFloat(formData.price)
    };

    try {
      if (editId) {
        await fetch(`/api/admin/menu/${editId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/admin/menu', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
      }
      setShowForm(false);
      setEditId(null);
      setFormData({ name: '', description: '', price: '', category: 'Mains', customCategory: '', restaurantId: '1' });
      fetchMenu();
    } catch(err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setFormData({ name: '', description: '', price: '', category: 'Mains', customCategory: '', restaurantId: '1' });
  };

  // Extract unique categories for filter
  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];
  
  const filteredItems = selectedCategoryFilter === 'All' 
    ? items 
    : items.filter(i => i.category === selectedCategoryFilter);

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">Menu items</h2>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedCategoryFilter} 
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          {!showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-600 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
            >
              <Plus className="w-5 h-5"/> Add Item
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              key="modal-content"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white shrink-0">
                 <h3 className="font-bold text-slate-800 text-xl">{editId ? 'Edit Item' : 'New Menu Item'}</h3>
                 <button type="button" onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6 overflow-y-auto bg-slate-50/50">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Item Name</label>
                        <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" placeholder="e.g. Garlic Bread" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                        <select required value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                          <option value="Starters">Starters</option>
                          <option value="Mains">Mains</option>
                          <option value="Sides">Sides</option>
                          <option value="Desserts">Desserts</option>
                          <option value="Drinks">Drinks</option>
                          <option value="Other">Other (Custom)</option>
                        </select>
                      </div>
                      
                      {formData.category === 'Other' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Custom Category Name</label>
                          <input required type="text" value={formData.customCategory} onChange={e=>setFormData({...formData, customCategory: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" placeholder="e.g. Signature Combos" />
                        </div>
                      )}

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                        <input required type="text" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" placeholder="Provide a tasty description..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Price (₹)</label>
                        <input required type="number" step="0.01" min="0" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={resetForm} className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors font-medium">Cancel</button>
                    <button type="submit" disabled={saving} className="bg-brand-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-600 focus:ring-4 focus:ring-brand-500/30 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2">
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editId ? 'Update Item' : 'Save Item'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <InlineLoader text="Loading menu..." />
      ) : filteredItems.length === 0 ? (
        <p className="text-slate-500 py-4">No menu items found in this category.</p>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedItems).map(([category, categoryItems]) => {
            const itemsList = categoryItems as any[];
            return (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">{category}</h3>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {itemsList.map((item: any) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      key={item._id} 
                      className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col hover:border-brand-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <h4 className="font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                        <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"><Edit className="w-4 h-4"/></button>
                          <button onClick={() => handleDelete(item._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 flex-1 mb-5 line-clamp-2 leading-relaxed">{item.description}</p>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-[11px] font-medium uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">{item.category}</span>
                        <span className="font-bold text-slate-900 text-lg">₹{Number(item.price || 0).toFixed(2)}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
