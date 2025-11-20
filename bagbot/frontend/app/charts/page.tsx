'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function ChartsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#FFF8E7] flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-[#F9D949]" />
          Trading Charts
        </h1>
        <p className="text-[#D4B5C4] mt-2">View real-time trading charts and technical analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#2A1721]/80 to-[#1A0E15]/80 backdrop-blur-sm border border-[#C75B7A]/30 rounded-xl p-6 h-96">
          <h2 className="text-xl font-bold text-[#FFF8E7] mb-4">BTC/USDT</h2>
          <div className="flex items-center justify-center h-64 text-[#D4B5C4]">
            Chart Component Coming Soon
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#2A1721]/80 to-[#1A0E15]/80 backdrop-blur-sm border border-[#C75B7A]/30 rounded-xl p-6 h-96">
          <h2 className="text-xl font-bold text-[#FFF8E7] mb-4">ETH/USDT</h2>
          <div className="flex items-center justify-center h-64 text-[#D4B5C4]">
            Chart Component Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
