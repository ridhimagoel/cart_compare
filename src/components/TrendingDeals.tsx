"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Users, ArrowUpRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const trendingItems = [
  {
    name: "AirPods Pro (2nd Gen)",
    price: "₹18,990",
    oldPrice: "₹24,900",
    popularity: 85,
    views: "12k",
    img: "https://images.unsplash.com/photo-1588423770574-f199ba448b1f?w=400&q=80"
  },
  {
    name: "Logitech MX Master 3S",
    price: "₹8,495",
    oldPrice: "₹10,995",
    popularity: 92,
    views: "8.5k",
    img: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&q=80"
  },
  {
    name: "Kindle Paperwhite",
    price: "₹11,999",
    oldPrice: "₹14,999",
    popularity: 78,
    views: "5.2k",
    img: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=400&q=80"
  },
  {
    name: "Nintendo Switch OLED",
    price: "₹28,500",
    oldPrice: "₹32,000",
    popularity: 65,
    views: "15k",
    img: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&q=80"
  }
];

const TrendingDeals = () => {
  return (
    <section className="py-32 px-6 bg-white/20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest mb-4">
              <Flame className="w-3 h-3 fill-current" /> Hot Right Now
            </div>
            <h2 className="text-5xl font-bold tracking-tighter">Trending <span className="text-gradient">Deals</span></h2>
          </div>
          <button className="text-sm font-bold text-purple-600 hover:underline">View All Trending →</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {trendingItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="glass rounded-[2.5rem] overflow-hidden group"
            >
              <div className="aspect-square overflow-hidden relative">
                <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Users className="w-3 h-3" /> {item.views}
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-bold text-lg mb-2 truncate">{item.name}</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-2xl font-black text-gray-900">{item.price}</span>
                  <span className="text-sm text-gray-400 line-through">{item.oldPrice}</span>
                </div>
                
                <div className="space-y-2 mb-8">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>Deal Popularity</span>
                    <span>{item.popularity}%</span>
                  </div>
                  <Progress value={item.popularity} className="h-1.5 bg-gray-100" />
                </div>

                <button className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold flex items-center justify-center gap-2 group-hover:bg-purple-600 transition-colors">
                  Get Deal <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingDeals;