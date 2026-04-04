"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Bell, ArrowRight, TrendingDown } from 'lucide-react';

const watchlistItems = [
  { name: "iPad Air M2", price: "₹54,900", target: "₹49,000", status: "Tracking", img: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&q=80" },
  { name: "Sony ZV-E10", price: "₹62,490", target: "₹58,000", status: "Price Drop!", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&q=80" },
  { name: "Marshall Emberton II", price: "₹14,999", target: "₹12,500", status: "Tracking", img: "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=200&q=80" },
];

const WatchlistPreview = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 text-pink-600 text-xs font-bold uppercase tracking-widest mb-8">
              <Heart className="w-4 h-4 fill-current" /> Your Workspace
            </div>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-8">
              Your personal <span className="text-gradient">deal hunter.</span>
            </h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Save products to your watchlist and let Vantage do the hard work. 
              We track prices 24/7 and notify you the moment your target price is hit.
            </p>
            
            <div className="space-y-6 mb-12">
              <div className="flex gap-4 items-center p-4 rounded-2xl bg-white shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="font-medium text-gray-700">Instant push notifications on price drops</p>
              </div>
              <div className="flex gap-4 items-center p-4 rounded-2xl bg-white shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <p className="font-medium text-gray-700">Historical data for every saved item</p>
              </div>
            </div>

            <button className="flex items-center gap-2 font-bold text-gray-900 hover:gap-4 transition-all">
              Explore Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 blur-3xl rounded-full" />
            <div className="relative space-y-4">
              {watchlistItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass p-6 rounded-3xl flex items-center gap-6 group hover:bg-white/80 transition-all"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-bold text-purple-600">{item.price}</span>
                      <span className="text-xs text-gray-400">Target: {item.target}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    item.status === 'Price Drop!' ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.status}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WatchlistPreview;