import React from 'react';

export function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
        <p>Last updated: October 2023</p>
        
        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, and other information you choose to provide.</p>
        
        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. How We Use Your Information</h2>
        <p>We may use the information we collect about you to Provide, maintain, and improve our Services, including, for example, to facilitate payments, send receipts, provide products and services you request, develop new features, provide customer support to Users and Delivery Partners.</p>

        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Sharing of Information</h2>
        <p>We may share your information with Delivery Partners to enable them to provide the Services you request. For example, we share your name and delivery address with the Delivery Partner fulfilling your order.</p>

        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Security</h2>
        <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
      </div>
    </div>
  );
}
