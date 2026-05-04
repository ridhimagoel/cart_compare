"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Search, BarChart, BellRing, ArrowUpRight, Clock3 } from 'lucide-react';

const DEMO_VIDEO_SRC = '/videos/search-demo.mp4';

const steps = [
  {
    title: "Search or Paste Link",
    desc: "Start with a product name or drop in a product URL from any supported store.",
    icon: Search,
    color: "text-blue-600",
    bg: "bg-blue-50",
    eta: "~15 sec",
    bullets: ["Type product name or paste URL", "Auto-detects model and variant"]
  },
  {
    title: "Compare Instantly",
    desc: "See final payable prices across stores, including coupons and delivery.",
    icon: BarChart,
    color: "text-purple-600",
    bg: "bg-purple-50",
    eta: "~2 sec",
    bullets: ["Live price + delivery in one view", "Coupons and offers auto-merged"]
  },
  {
    title: "Track and Save",
    desc: "Set your target price and get notified the moment it drops.",
    icon: BellRing,
    color: "text-pink-600",
    bg: "bg-pink-50",
    eta: "24/7",
    bullets: ["Instant price drop alerts", "Buy-now vs wait recommendation"]
  }
];

const HowItWorks = () => {
  const [videoFailed, setVideoFailed] = React.useState(false);

  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 text-xs font-bold tracking-widest uppercase text-purple-700 mb-6">
            <Clock3 className="w-4 h-4" /> Beginner Friendly Flow
          </span>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6">
            Shopping made <span className="italic text-gradient">simpler.</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
            Three simple steps to ensure you never overpay again.
          </p>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 md:gap-12 relative">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.015 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="group relative flex-shrink-0 min-w-[280px] md:min-w-0"
            >
              <div className="how-step-card rounded-[2.2rem] p-8 h-full border border-white/15 bg-[linear-gradient(120deg,rgba(8,17,40,0.94),rgba(5,9,24,0.96))] shadow-[0_20px_60px_rgba(2,6,23,0.45)] transition-all duration-500 relative overflow-hidden">

                <div className="flex items-start justify-between mb-8">
                  <div className={`w-20 h-20 rounded-[1.4rem] ${step.bg} flex items-center justify-center relative transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                    <step.icon className={`w-9 h-9 ${step.color}`} />
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-sm font-bold text-slate-500">
                      0{i + 1}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-slate-200 border border-white/20">
                    {step.eta}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-300 leading-relaxed mb-6">{step.desc}</p>

                <div className="space-y-2 mb-6">
                  {step.bullets.map((b) => (
                    <div key={b} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full h-11 rounded-xl bg-[#081a38] text-white border border-white/15 font-semibold flex items-center justify-center gap-2 hover:bg-[#0e2952] transition-colors">
                  Try This Step <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Video/demo section removed per request */}
      </div>
    </section>
  );
};

export default HowItWorks;