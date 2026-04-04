"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Search, BarChart, BellRing } from 'lucide-react';

const steps = [
  {
    title: "Search Anything",
    desc: "Enter any product name or paste a link from your favorite store.",
    icon: Search,
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  {
    title: "Compare Instantly",
    desc: "Our AI scans 50+ retailers to find the absolute lowest price.",
    icon: BarChart,
    color: "text-purple-600",
    bg: "bg-purple-50"
  },
  {
    title: "Save Forever",
    desc: "Set alerts and get notified the moment prices drop further.",
    icon: BellRing,
    color: "text-pink-600",
    bg: "bg-pink-50"
  }
];

const HowItWorks = () => {
  return (
    <section className="py-32 px-6 bg-white/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6">
            Shopping made <span className="italic text-gradient">effortless.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Three simple steps to ensure you never overpay again.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent -translate-y-1/2 -z-10" />
          
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="flex flex-col items-center text-center group"
            >
              <div className={`w-24 h-24 rounded-[2rem] ${step.bg} flex items-center justify-center mb-8 relative transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-sm font-bold text-gray-400">
                  0{i + 1}
                </div>
                <step.icon className={`w-10 h-10 ${step.color}`} />
              </div>
              <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed max-w-[250px]">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;