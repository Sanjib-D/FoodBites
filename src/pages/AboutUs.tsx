import React from 'react';

export function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900 mb-6">About Food Bites</h1>
      <div className="prose prose-slate max-w-none">
        <p className="text-lg text-slate-600 mb-6">
          Founded in Guwahati, Assam in 2026, Food Bites started with a simple forward-thinking mission: to connect local food lovers with the absolute best culinary experiences our city has to offer, delivered seamlessly and reliably right to their doorsteps.
        </p>
        <div className="rounded-xl overflow-hidden mb-8">
          <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80" alt="Restaurant kitchen" className="w-full h-64 object-cover" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Our Story</h2>
        <p className="text-slate-600 mb-6">
          We believe that great food brings people together. Whether it's a quick lunch break, a family dinner, or a late-night craving, our platform bridges the gap between hungry individuals and top-rated local restaurants. Experiencing rapid growth this year, we've transformed from a small neighborhood delivery service to a robust city-wide food ordering ecosystem leveraging smart logistics and real-time order tracking.
        </p>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Our Values</h2>
        <ul className="list-disc pl-5 text-slate-600 space-y-2">
          <li><strong>Quality First:</strong> We partner only with restaurants that maintain the highest standards of hygiene, taste, and consistency.</li>
          <li><strong>Speed & Reliability:</strong> Our 2026 delivery partners employ a brand-new optimized dispatch system to ensure your food arrives hot, fresh, and exceptionally on time.</li>
          <li><strong>Local Empowerment:</strong> We strive to support local businesses, giving them a digital storefront equipped with AI analytics to reach much more scale.</li>
        </ul>
      </div>
    </div>
  );
}
