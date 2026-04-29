import React from 'react';
import { Loader2, UtensilsCrossed } from 'lucide-react';

export const LoadingScreen = () => (
  <div className="flex-1 flex justify-center items-center py-20 min-h-[50vh]">
    <div className="relative">
      <div className="absolute inset-0 bg-brand-500 rounded-full animate-ping opacity-20"></div>
      <div className="relative bg-white p-4 rounded-full shadow-lg border border-brand-100 flex items-center justify-center">
        <UtensilsCrossed className="w-8 h-8 text-brand-500 animate-pulse" />
      </div>
    </div>
  </div>
);

export const InlineLoader = () => (
  <div className="flex justify-center items-center py-8">
    <div className="relative">
       <div className="absolute inset-0 bg-brand-500 rounded-full animate-ping opacity-20"></div>
       <div className="relative bg-white p-2 rounded-full shadow-sm border border-brand-100 flex items-center justify-center">
         <UtensilsCrossed className="w-5 h-5 text-brand-500 animate-pulse" />
       </div>
    </div>
  </div>
);
