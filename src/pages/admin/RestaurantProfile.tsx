import React, { useState, useEffect } from 'react';
import { Camera, Save } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

export function RestaurantProfile() {
  const { data: restaurant, loading } = useApi<any>('/api/restaurants/1'); // Using 1 as mock ID for now
  const [formData, setFormData] = useState<any>({
    name: '',
    cuisine: '',
    deliveryTime: '',
    minOrder: 0,
    about: '',
    image: '',
    tags: ''
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (restaurant) {
      setFormData({
        ...restaurant,
        tags: Array.isArray(restaurant.tags) ? restaurant.tags.join(', ') : restaurant.tags
      });
    }
  }, [restaurant]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const restId = restaurant?._id || '1';
      const updatedData = { ...formData, tags: formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) };
      await fetch(`/api/admin/restaurants/${restId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      setSaveMessage('Profile successfully updated!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Failed to update profile');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024) {
        setSaveMessage('Failed: File size exceeds 100KB limit. Please choose a smaller image.');
        setTimeout(() => setSaveMessage(''), 4000);
        e.target.value = ''; // Reset the input
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Restaurant Profile</h1>
        <p className="text-slate-500">Manage your restaurant details and cover image.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Cover Image Section */}
        <div className="relative h-64 bg-slate-100 group">
          {formData.image ? (
            <img src={formData.image} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-slate-400">No cover image</div>
          )}
          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
             <div className="bg-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-slate-50 transition-colors">
                <Camera className="w-4 h-4" /> Upload Cover Image
             </div>
             <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
        
        <div className="p-8 pb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Image Link (Auto-filled on upload)</label>
          <input 
            type="text" 
            name="image" 
            value={formData.image || ''} 
            onChange={handleChange} 
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 bg-slate-50" 
            placeholder="Upload an image above or paste a URL here" 
          />
        </div>

        <div className="p-8 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant Name</label>
            <input 
              required type="text" name="name" 
              value={formData.name || ''} onChange={handleChange} 
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cuisine / Primary Style</label>
            <input 
              required type="text" name="cuisine" 
              value={formData.cuisine || ''} onChange={handleChange} 
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Time (e.g. 30-45 min)</label>
            <input 
              type="text" name="deliveryTime" 
              value={formData.deliveryTime || ''} onChange={handleChange} 
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500" 
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags (Comma separated)</label>
            <input 
              type="text" name="tags" 
              value={formData.tags || ''} onChange={handleChange} 
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500" 
              placeholder="Pizza, Italian, Fast Food"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">About Restaurant</label>
            <textarea 
              name="about" rows={4} 
              value={formData.about || ''} onChange={handleChange} 
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500" 
            ></textarea>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className={`text-sm font-medium ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
            {saveMessage}
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 bg-brand-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" /> 
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
