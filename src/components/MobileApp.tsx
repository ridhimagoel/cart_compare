"use client";

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Apple, PlayCircle, Smartphone } from 'lucide-react';
import Magnetic from './Magnetic';

const MobileApp = () => {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 200]);

  return (
    <section className="py-32 px-6 overflow-hidden bg-gray-900 text-white rounded-[4rem] mx-6 my-20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-widest mb-8">
              <Smartphone className="w-4 h-4" /> Mobile First
            </div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8">
              Savings in your <span className="text-blue-400 italic">pocket.</span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 leading-relaxed max-w-lg">
              Get instant price alerts, track your favorite products, and manage your wishlist on the go. 
              The ultimate shopping companion is now available for iOS and Android.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Magnetic strength={0.2}>
                <button className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-gray-900 font-bold hover:scale-105 transition-transform">
                  <Apple className="w-6 h-6" /> App Store
                </button>
              </Magnetic>
              <Magnetic strength={0.2}>
                <button className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all">
                  <PlayCircle className="w-6 h-6" /> Google Play
                </button>
              </Magnetic>
            </div>
          </motion.div>
        </div>

        <div className="relative h-[600px] flex justify-center items-center">
          <motion.div 
            style={{ y: y1 }}
            className="absolute left-0 w-64 h-[500px] bg-gradient-to-br from-purple-500 to-blue-600 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="w-full h-40 bg-white/20 rounded-2xl mb-4 animate-pulse" />
              <div className="w-3/4 h-4 bg-white/20 rounded-full mb-2" />
              <div className="w-1/2 h-4 bg-white/20 rounded-full" />
            </div>
          </motion.div>
          
          <motion.div 
            style={{ y: y2 }}
            className="absolute right-0 w-64 h-[500px] bg-gradient-to-br from-pink-500 to-purple-600 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden z-20"
          >
            <div className="p-6 flex flex-col justify-end h-full">
              <div className="w-full h-12 bg-white rounded-xl mb-4 flex items-center justify-center text-purple-600 font-bold">
                Price Drop!
              </div>
              <div className="w-full h-40 bg-white/20 rounded-2xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MobileApp;