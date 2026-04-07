"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Bell, Zap, Shield, BarChart3, Brain, TicketPercent, ArrowUpRight } from 'lucide-react';

const features = [
  {
    title: "Real-time Alerts",
    desc: "Get notified the second a price drops below your target.",
    icon: Bell,
    color: "bg-blue-500",
    tag: "Instant",
    metric: "< 5s latency"
  },
  {
    title: "Instant Compare",
    desc: "Compare 50+ stores in under 2 seconds with our AI engine.",
    icon: Zap,
    color: "bg-purple-500",
    tag: "Fast",
    metric: "50+ stores"
  },
  {
    title: "Verified Deals",
    desc: "Every deal is verified for authenticity and stock availability.",
    icon: Shield,
    color: "bg-pink-500",
    tag: "Trusted",
    metric: "99.2% valid"
  },
  {
    title: "Deep Analytics",
    desc: "Understand market trends with our historical data visualization.",
    icon: BarChart3,
    color: "bg-indigo-500",
    tag: "Insight",
    metric: "365-day history"
  },
  {
    title: "Smart Buy Signals",
    desc: "AI tells you whether to buy now or wait for the next likely discount window.",
    icon: Brain,
    color: "bg-violet-500",
    tag: "AI",
    metric: "85% accuracy"
  },
  {
    title: "Coupon Stack Check",
    desc: "Tests available coupon combinations to maximize savings at checkout.",
    icon: TicketPercent,
    color: "bg-emerald-500",
    tag: "Savings",
    metric: "Up to 28% extra"
  }
];

const Features = () => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const rawX = useTransform(scrollYProgress, [0, 1], ["0%", "-62%"]);
  const x = useSpring(rawX, {
    stiffness: 120,
    damping: 28,
    mass: 0.3,
  });

  return (
    <section ref={targetRef} className="relative h-[380vh] bg-transparent">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
          <a
            href="#how-it-works"
            className="px-4 h-10 rounded-full bg-white/90 border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-white hover:text-gray-900 transition-colors inline-flex items-center"
          >
            Jump to How It Works
          </a>
        </div>

        <motion.div style={{ x }} className="flex gap-8 px-20 will-change-transform transform-gpu">
          <div className="flex-shrink-0 w-[400px] flex flex-col justify-center">
            <h2 className="text-6xl font-bold tracking-tighter mb-6">
              Built to make <span className="text-gradient">shopping easier.</span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              From faster comparison to cleaner alerts, everything is designed to help you buy confidently.
            </p>
            <a
              href="#how-it-works"
              className="mt-6 inline-flex items-center text-sm font-bold text-purple-700 hover:text-purple-900 transition-colors"
            >
              Prefer quick steps? Open How It Works →
            </a>
          </div>
          
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="relative flex-shrink-0 w-[450px] h-[500px] glass rounded-[3rem] p-10 flex flex-col justify-between group border border-white/50 hover:bg-white/75 hover:shadow-2xl hover:shadow-purple-200/40 hover:-translate-y-1 transition-all duration-500"
            >
              <div className="absolute inset-0 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/0 via-white/40 to-purple-100/40 pointer-events-none" />

              <div className="relative z-10 flex items-start justify-between">
                <div className={`w-16 h-16 ${f.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
                  <f.icon className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 rounded-full bg-gray-900/5 text-gray-700 text-xs font-bold uppercase tracking-widest border border-gray-200/80">
                  {f.tag}
                </span>
              </div>

              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-4">{f.title}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">{f.desc}</p>
              </div>

              <div className="relative z-10 space-y-5">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/70 border border-gray-100 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Performance</span>
                  <span className="text-sm font-bold text-gray-900">{f.metric}</span>
                </div>

                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${f.color}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    transition={{ duration: 0.9, delay: 0.2 }}
                  />
                </div>

                <button className="w-full h-12 rounded-xl bg-gray-900 text-white font-semibold flex items-center justify-center gap-2 hover:bg-black transition-colors">
                  Learn More <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;