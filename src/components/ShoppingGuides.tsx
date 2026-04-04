"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, Clock, Tag } from 'lucide-react';

const guides = [
  {
    title: "When to buy the iPhone 15?",
    desc: "Our data suggests waiting until the September event for the biggest price drop.",
    tag: "Smartphones",
    readTime: "5 min read",
    img: "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=600&q=80"
  },
  {
    title: "Best Budget Laptops 2024",
    desc: "We compared 50+ laptops to find the best value for students and pros.",
    tag: "Laptops",
    readTime: "8 min read",
    img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80"
  },
  {
    title: "Noise Cancelling Guide",
    desc: "Sony vs Bose vs Apple: Which one offers the best bang for your buck?",
    tag: "Audio",
    readTime: "6 min read",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80"
  }
];

const ShoppingGuides = () => {
  return (
    <section className="py-32 px-6 bg-white/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">
              <BookOpen className="w-3 h-3" /> Expert Advice
            </div>
            <h2 className="text-5xl font-bold tracking-tighter">Shopping <span className="text-gradient">Guides</span></h2>
          </div>
          <button className="text-sm font-bold text-purple-600 hover:underline">View All Guides →</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {guides.map((guide, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-[2.5rem] overflow-hidden group cursor-pointer"
            >
              <div className="aspect-[16/10] overflow-hidden relative">
                <img src={guide.img} alt={guide.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {guide.tag}
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                  <Clock className="w-3 h-3" /> {guide.readTime}
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-600 transition-colors">{guide.title}</h3>
                <p className="text-gray-500 mb-8 line-clamp-2">{guide.desc}</p>
                <div className="flex items-center gap-2 font-bold text-gray-900 group-hover:gap-4 transition-all">
                  Read Guide <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShoppingGuides;