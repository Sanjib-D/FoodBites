import React, { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const [imgError, setImgError] = useState(false);

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4 group">
              {!imgError ? (
                <img 
                  src="/logo_white.png" 
                  alt="Food Bites" 
                  className="h-8 w-auto object-contain" 
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
              )}
              <span className="font-bold text-lg tracking-tight text-white">Food Bites</span>
            </div>
            <p className="text-sm text-slate-500">
              Delivering happiness to your doorstep. Best food, fastest delivery.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-3">Company</h4>
            <ul className="space-y-1.5 text-sm text-slate-500">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3">Support</h4>
            <ul className="space-y-1.5 text-sm text-slate-500">
              <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3">Contact</h4>
            <ul className="space-y-1.5 text-sm text-slate-500">
              <li>contact@foodbites.com</li>
              <li>1-800-FOOD-BITE</li>
              <li>MG Road, Guwahati, Assam</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-8 pt-6 text-sm text-slate-600 flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} Food Bites. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
