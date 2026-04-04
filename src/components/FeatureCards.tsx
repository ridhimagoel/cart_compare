"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, ShieldCheck, Zap, BarChart3 } from 'lucide-react';

const features = [
  {
    title: "Price Tracking",
    description: "Real-time monitoring across 50+ major retailers to find the absolute lowest price.",
    icon: BarChart3,
    color: "bg-blue-500/10 text-blue-500"
  },
  {
    title: "Instant Alerts",
    description: "Get notified the second a price drops below your target threshold.",
    icon: Bell,
    color: "bg-purple-500/10 text-purple-500"
  },
  {
    title: "Verified Deals",
    description: "Every deal is scanned by Vantage AI to ensure it's authentic and in stock.",
    icon: ShieldCheck,
    color: "bg-green-500/10 text-green-500"
  },
  {
    title: "Flash Sales",
    description: "Exclusive access to limited-time offers before they go viral.",
    icon: Zap,
    color: "bg-yellow-500/10 text-yellow-500"
  }
];

const FeatureCards = () => {
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Smart Shopping, Simplified.
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Everything you need to stop overpaying and start saving on the products you love.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-[2.5rem] border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;