"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';

const tickerItems = [
  { name: "iPhone 15 Pro", price: "₹1,29,900", change: -4500, trend: "down" },
  { name: "Sony PS5", price: "₹44,990", change: -2000, trend: "down" },
  { name: "MacBook Air M3", price: "₹1,04,900", change: +1500, trend: "up" },
  { name: "Nike Air Max", price: "₹8,495", change: -1200, trend: "down" },
  { name: "Samsung S24 Ultra", price: "₹1,19,999", change: -8000, trend: "down" },
  { name: "iPad Pro", price: "₹79,900", change: 0, trend: "neutral" },
];

const TopTicker = () => {
  return (
    <div className="w-full bg-gray-900 text-white py-2 overflow-hidden whitespace-nowrap relative z-[60]">
      <motion.div 
        animate={{ x: [0, -1000] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex gap-12 items-center"
      >
        {[...tickerItems, ...tickerItems].map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
            <span className="text-gray-400">{item.name}</span>
            <span>{item.price}</span>
            {item.trend === 'down' ? (
              <span className="text-green-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> {item.change}
              </span>
            ) : item.trend === 'up' ? (
              <span className="text-red-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +{item.change}
              </span>
            ) : (
              <span className="text-gray-500">STABLE</span>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default TopTicker;