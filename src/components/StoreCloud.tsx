"use client";

import React from 'react';
import { motion } from 'framer-motion';

const stores = [
  { name: "Amazon", logo: "/stores/amazon.svg" },
  { name: "Flipkart", logo: "/stores/flipkart.svg" },
  { name: "Myntra", logo: "/stores/myntra.svg" },
  { name: "Meesho", logo: "/stores/meesho.svg" },
];

const StoreCloud = () => {
  return (
    <section className="py-20 overflow-hidden bg-white/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Supported Everywhere</p>
          <h2 className="text-4xl font-bold tracking-tighter">Compare across top retailers</h2>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 md:gap-14">
          {stores.map((store, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.1, rotate: i % 2 === 0 ? 5 : -5 }}
              className="w-48 h-20 glass rounded-2xl p-3 flex items-center justify-center transition-all duration-500 cursor-pointer"
            >
              <img src={store.logo} alt={store.name} loading="lazy" className="max-w-full max-h-full object-contain" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoreCloud;