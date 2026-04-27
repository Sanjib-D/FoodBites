import React, { useEffect, useState } from 'react';
import { Trash2, Edit, Plus, X } from 'lucide-react';

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
      const res = await fetch('/api/admin/menu');
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
      await fetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/admin/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
              className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4"/> Add Item
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 p-6 rounded-lg border border-slate-100 space-y-4 relative">
          <button type="button" onClick={resetForm} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
             <X className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">{editId ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
              <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g. Garlic Bread" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select required value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 rounded border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Category Name</label>
                <input required type="text" value={formData.customCategory} onChange={e=>setFormData({...formData, customCategory: e.target.value})} className="w-full px-3 py-2 rounded border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g. Signature Combos" />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <input required type="text" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 rounded border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
              <input required type="number" step="0.01" min="0" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 rounded border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">
            {saving ? 'Saving...' : (editId ? 'Update Item' : 'Save Item')}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500 py-4">Loading menu...</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-slate-500 py-4">No menu items found in this category.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div key={item._id} className="border border-slate-100 rounded-lg p-4 flex flex-col hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start mb-2 gap-4">
                <h4 className="font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-brand-600 transition-colors"><Edit className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(item._id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              <p className="text-sm text-slate-500 flex-1 mb-4 line-clamp-2">{item.description}</p>
              <div className="flex justify-between border-t border-slate-50 pt-3">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{item.category}</span>
                <span className="font-bold text-slate-900">₹{parseFloat(item.price).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
