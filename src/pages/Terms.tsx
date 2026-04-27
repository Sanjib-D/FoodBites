import React from 'react';

export function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Terms and Conditions</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
        <p>Last updated: October 2023</p>
        
        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>By accessing and using Food Bites, you accept and agree to be bound by the terms and provision of this agreement. Any participation in this service will constitute acceptance of this agreement.</p>
        
        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. User Accounts</h2>
        <p>To use certain features of the platform, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>

        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Ordering and Payment</h2>
        <p>All orders are subject to availability and confirmation of the order price. Food Bites partners with third-party payment gateways for secure transactions. We do not store your credit card information.</p>

        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Delivery Policies</h2>
        <p>Delivery times are estimates and cannot be guaranteed. We are not liable for any delays caused by circumstances beyond our control including, but not limited to, severe weather conditions, traffic blocks, or restaurant operational delays.</p>
      </div>
    </div>
  );
}
