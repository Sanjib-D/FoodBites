import React from 'react';
import { HelpCircle, Clock, Truck, ShieldAlert } from 'lucide-react';

export function HelpCenter() {
  const faqs = [
    { q: "How long does delivery take?", a: "Most deliveries take between 25-45 minutes depending on traffic and restaurant preparation time. You can track your order live via map tracking on the order status page." },
    { q: "What is the minimum order amount?", a: "There is no minimum order amount for most of our partner restaurants, though delivery fees may vary based on your distance from the selected kitchen." },
    { q: "How do I cancel my order?", a: "You can cancel your order within 2 minutes of placing it from the active orders screen. Once the restaurant accepts and starts preparing, cancellations cannot be automatically processed." },
    { q: "Do you offer refunds for missing items?", a: "Yes. If an item is missing from your delivery, please contact our support team immediately. We guarantee instant credits or refunds for any verified discrepancies." },
    { q: "How do the restaurant ratings work?", a: "Our ratings are strictly generated from verified customers who have completed an order. This ensures actual diner feedback is front and center." },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Help Center</h1>
        <p className="text-lg text-slate-600">How can we help you today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
          <Truck className="w-8 h-8 text-brand-500 mx-auto mb-4" />
          <h3 className="font-bold text-slate-800 mb-2">Delivery Issues</h3>
          <p className="text-sm text-slate-500">Having trouble with your delivery? Track live or contact the driver.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
          <ShieldAlert className="w-8 h-8 text-brand-500 mx-auto mb-4" />
          <h3 className="font-bold text-slate-800 mb-2">Account & Safety</h3>
          <p className="text-sm text-slate-500">Manage security, passwords, and profile settings.</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-2">Frequently Asked Questions</h2>
      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-500" />
              {faq.q}
            </h3>
            <p className="text-slate-600 pl-7">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
