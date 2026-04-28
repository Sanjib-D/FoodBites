import React from 'react';

export function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
        <p className="font-semibold text-slate-800">Last updated: April 2026</p>
        
        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, delivery addresses, order history, profile picture, payment method tokens, and other information you choose to provide.</p>
        
        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. How We Use Your Information</h2>
        <p>We may use the information we collect about you to Provide, maintain, and improve our Services, including, for example, to facilitate payments, send digital receipts, provide products and services you request, develop new AI-driven recommendation features, provide customer support to Users and Delivery Partners, and send promotional offers (if opted in).</p>

        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Sharing of Information</h2>
        <p>We share your information with Delivery Partners to enable them to provide the Services you request. For example, we share your name and delivery address with the Delivery Partner fulfilling your order. We also anonymize data for analytics to improve operations and personalized local restaurant discovery.</p>

        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Data Retention and Security</h2>
        <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. User accounts and related personal data are retained as long as the account remains active, after which they are securely archived or expunged in accordance with applicable 2026 privacy regulations.</p>
      </div>
    </div>
  );
}
