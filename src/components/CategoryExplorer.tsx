"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Laptop, Watch, Headphones, Camera, Gamepad2 } from 'lucide-react';

const categories = [
  { name: "Phones", icon: Smartphone, color: "from-blue-500 to-cyan-400", count: "1.2k+ deals" },
  { name: "Laptops", icon: Laptop, color: "from-purple-500 to-indigo-400", count: "800+ deals" },
  { name: "Audio", icon: Headphones, color: "from-pink-500 to-rose-400", count: "2.4k+ deals" },
  { name: "Wearables", icon: Watch, color: "from-orange-500 to-amber-400", count: "600+ deals" },
  { name: "Gaming", icon: Gamepad2, color: "from-emerald-500 to-teal-400", count: "1.5k+ deals" },
  { name: "Cameras", icon: Camera, color: "from-violet-500 to-purple-400", count: "400+ deals" },
];

const CategoryExplorer = () => {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
        <div className="max-w-xl">
          <h2 className="text-5xl font-bold tracking-tighter mb-4">
            Explore <span className="text-gradient">Categories</span>
          </h2>
          <p className="text-lg text-gray-600">
            Find the best deals across all your favorite tech categories.
          </p>
        </div>
        <button className="text-sm font-bold uppercase tracking-widest text-purple-600 hover:text-purple-700 transition-colors">
          View All Categories →
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {categories.map((cat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8 }}
            className="group cursor-pointer"
          >
            <div className="relative aspect-square rounded-[2.5rem] glass overflow-hidden mb-4 flex flex-col items-center justify-center gap-4 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-purple-500/10">
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                <cat.icon className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900">{cat.name}</h3>
                <p className="text-xs text-gray-500 font-medium">{cat.count}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CategoryExplorer;