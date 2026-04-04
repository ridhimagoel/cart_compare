"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingDown, ArrowRight } from 'lucide-react';

const legendaryDrops = [
  {
    product: "iPhone 14 Pro",
    drop: "₹25,000",
    date: "Prime Day 2023",
    store: "Amazon",
    img: "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=400&q=80"
  },
  {
    product: "Sony WH-1000XM4",
    drop: "₹12,500",
    date: "Black Friday",
    store: "Flipkart",
    img: "https://images.unsplash.com/photo-1618366712277-70f398c2733d?w=400&q=80"
  },
  {
    product: "MacBook Air M1",
    drop: "₹30,000",
    date: "BBD Sale",
    store: "Flipkart",
    img: "https://images.unsplash.com/photo-1611186871348-b1fe696c52d9?w=400&q=80"
  }
];

const HallOfFame = () => {
  return (
    <section className="py-32 px-6 bg-gray-900 text-white rounded-[4rem] mx-6 my-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/10 text-yellow-400 text-xs font-bold uppercase tracking-widest mb-8 border border-yellow-400/20">
            <Trophy className="w-4 h-4" /> Legendary Drops
          </div>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
            The Hall of <span className="text-blue-400 italic">Fame.</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A look back at the most significant price drops ever tracked by the Vantage community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {legendaryDrops.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass border-white/10 p-8 rounded-[3rem] group hover:bg-white/10 transition-all"
            >
              <div className="aspect-square rounded-2xl overflow-hidden mb-8">
                <img src={item.img} alt={item.product} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.date}</span>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{item.store}</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">{item.product}</h3>
              <div className="flex items-center gap-2 text-green-400 font-black text-3xl tracking-tighter">
                <TrendingDown className="w-6 h-6" />
                -{item.drop}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <button className="group flex items-center gap-2 mx-auto font-bold text-white hover:gap-4 transition-all">
            View All Historical Drops <ArrowRight className="w-5 h-5 text-blue-400" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HallOfFame;