"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, Wallet } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const SavingsCalculator = () => {
  const [monthlySpend, setMonthlySpend] = useState([15000]);
  const estimatedSavings = Math.round(monthlySpend[0] * 0.18); // 18% average savings

  return (
    <section className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold tracking-tighter mb-4">
            Calculate your <span className="text-gradient">Savings</span>
          </h2>
          <p className="text-lg text-gray-600">
            See how much you could save annually by using Vantage for your shopping.
          </p>
        </div>

        <div className="glass rounded-[3rem] p-8 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="text-sm font-bold uppercase tracking-widest text-gray-400">Monthly Shopping Spend</label>
                <span className="text-3xl font-bold text-gray-900">₹{monthlySpend[0].toLocaleString()}</span>
              </div>
              <Slider 
                value={monthlySpend} 
                onValueChange={setMonthlySpend} 
                max={100000} 
                step={1000}
                className="py-4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                <TrendingUp className="w-6 h-6 text-blue-600 mb-4" />
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Avg. Discount</p>
                <p className="text-2xl font-bold text-gray-900">18%</p>
              </div>
              <div className="p-6 rounded-3xl bg-purple-50 border border-purple-100">
                <Wallet className="w-6 h-6 text-purple-600 mb-4" />
                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">Stores Scanned</p>
                <p className="text-2xl font-bold text-gray-900">50+</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <motion.div 
              key={estimatedSavings}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 rounded-[2.5rem] p-12 text-center text-white shadow-2xl"
            >
              <Calculator className="w-12 h-12 text-purple-400 mx-auto mb-6" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Estimated Annual Savings</p>
              <h3 className="text-6xl font-bold tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                ₹{(estimatedSavings * 12).toLocaleString()}
              </h3>
              <button className="w-full py-4 rounded-2xl bg-white text-gray-900 font-bold hover:bg-gray-100 transition-colors">
                Start Saving Now
              </button>
            </motion.div>
            
            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SavingsCalculator;