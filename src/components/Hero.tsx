"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Hero = () => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-white/20 glass mb-8"
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-bold tracking-widest uppercase text-gray-600">Smart Price Tracking</span>
        </motion.div>

        <motion.h1 
          className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[1.1]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          Prices <span className="text-gradient italic">Compete.</span><br />
          You <span className="relative">
            Win.
            <motion.span 
              className="absolute -bottom-2 left-0 w-full h-2 bg-blue-400/30 rounded-full -z-10"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 1, duration: 0.8 }}
            />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Instantly compare prices across Amazon, Flipkart, Myntra and 50+ stores. 
          Save more with real-time insights and historical data.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="relative max-w-2xl mx-auto group"
        >
          <div className={`absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-20 transition duration-1000 group-hover:opacity-40 ${isFocused ? 'opacity-60' : ''}`} />
          <div className="relative flex items-center glass rounded-2xl p-2">
            <Search className="ml-4 w-6 h-6 text-gray-400" />
            <Input 
              placeholder="Search for any product..." 
              className="border-none bg-transparent text-lg h-14 focus-visible:ring-0 placeholder:text-gray-400"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <button className="bg-gray-900 text-white rounded-xl px-8 h-14 font-bold flex items-center gap-2 hover:bg-gray-800 transition-all active:scale-95">
              Compare <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;