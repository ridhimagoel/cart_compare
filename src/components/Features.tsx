"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Bell, Zap, Shield, BarChart3 } from 'lucide-react';

const features = [
  {
    title: "Real-time Alerts",
    desc: "Get notified the second a price drops below your target.",
    icon: Bell,
    color: "bg-blue-500"
  },
  {
    title: "Instant Compare",
    desc: "Compare 50+ stores in under 2 seconds with our AI engine.",
    icon: Zap,
    color: "bg-purple-500"
  },
  {
    title: "Verified Deals",
    desc: "Every deal is verified for authenticity and stock availability.",
    icon: Shield,
    color: "bg-pink-500"
  },
  {
    title: "Deep Analytics",
    desc: "Understand market trends with our historical data visualization.",
    icon: BarChart3,
    color: "bg-indigo-500"
  }
];

const Features = () => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-transparent">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-8 px-20">
          <div className="flex-shrink-0 w-[400px] flex flex-col justify-center">
            <h2 className="text-6xl font-bold tracking-tighter mb-6">
              Why choose <span className="text-gradient">Vantage?</span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              We've built the most powerful price tracking engine on the planet. 
              Scroll to explore our core features.
            </p>
          </div>
          
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="flex-shrink-0 w-[450px] h-[500px] glass rounded-[3rem] p-12 flex flex-col justify-between group hover:bg-white/60 transition-colors duration-500"
            >
              <div className={`w-16 h-16 ${f.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                <f.icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-4">{f.title}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
              <div className="h-1 w-20 bg-gray-200 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${f.color}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;