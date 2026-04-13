"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowDown, Globe } from 'lucide-react';

const liveDeals = [
  { item: "Sony PS5", store: "Amazon", drop: "₹5,000", time: "2m ago", img: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=100&h=100&fit=crop" },
  { item: "Nike Air Jordan", store: "Myntra", drop: "₹2,400", time: "5m ago", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop" },
  { item: "iPad Air M2", store: "Flipkart", drop: "₹8,000", time: "12m ago", img: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&h=100&fit=crop" },
  { item: "Samsung S24", store: "Reliance", drop: "₹12,000", time: "15m ago", img: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=100&h=100&fit=crop" },
];

const LiveFeed = () => {
  return (
    <section className="py-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="relative">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-ping absolute inset-0" />
            <div className="w-4 h-4 bg-red-500 rounded-full relative" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
            Live Deal Radar <span className="text-gray-500 dark:text-slate-300 font-medium text-lg">| Recent tracked drops</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {liveDeals.map((deal, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-4 rounded-3xl flex items-center gap-4 group hover:bg-white/60 dark:hover:bg-white/10 transition-all cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                <img src={deal.img} alt={deal.item} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="truncate font-bold text-slate-900 dark:text-white">{deal.item}</h4>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-slate-300">
                  <Globe className="w-3 h-3" /> {deal.store} • {deal.time}
                </div>
                <div className="mt-1 flex items-center gap-1 text-green-600 dark:text-emerald-400 font-bold text-sm">
                  <ArrowDown className="w-3 h-3" /> {deal.drop} drop
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/90 text-slate-700 flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-colors">
                <Zap className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveFeed;