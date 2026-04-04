"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const categories = [
  { name: "Smartphones", discount: 24, intensity: "bg-purple-600", items: "1.2k items" },
  { name: "Laptops", discount: 18, intensity: "bg-purple-500", items: "850 items" },
  { name: "Audio", discount: 32, intensity: "bg-purple-700", items: "2.4k items" },
  { name: "Gaming", discount: 15, intensity: "bg-purple-400", items: "1.5k items" },
  { name: "Cameras", discount: 12, intensity: "bg-purple-300", items: "400 items" },
  { name: "Wearables", discount: 28, intensity: "bg-purple-600", items: "600 items" },
  { name: "Tablets", discount: 20, intensity: "bg-purple-500", items: "300 items" },
  { name: "Accessories", discount: 45, intensity: "bg-purple-900", items: "5k items" },
];

const PriceHeatmap = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-5xl font-bold tracking-tighter mb-4">
              Savings <span className="text-gradient">Heatmap</span>
            </h2>
            <p className="text-lg text-gray-600">
              Real-time visualization of average discount intensity across major tech categories.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
            <span>Low Drop</span>
            <div className="flex gap-1">
              {[300, 400, 500, 600, 700, 900].map(v => (
                <div key={v} className={`w-4 h-4 rounded-sm bg-purple-${v}`} />
              ))}
            </div>
            <span>High Drop</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <TooltipProvider>
            {categories.map((cat, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className={`${cat.intensity} p-8 rounded-[2.5rem] text-white cursor-help relative overflow-hidden group shadow-xl`}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                      <TrendingDown className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{cat.name}</h3>
                    <div className="text-4xl font-black tracking-tighter mb-4">
                      {cat.discount}% <span className="text-sm font-medium opacity-60">AVG</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60">{cat.items}</p>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className="glass p-4 rounded-2xl border-none shadow-2xl">
                  <div className="space-y-2">
                    <p className="font-bold text-gray-900">Market Insight</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {cat.name} are seeing a significant price correction this week due to upcoming model refreshes.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </section>
  );
};

export default PriceHeatmap;