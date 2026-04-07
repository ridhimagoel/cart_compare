"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Timer, ShoppingCart, Share2 } from 'lucide-react';
import Magnetic from './Magnetic';

const FeaturedDeal = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-[4rem] overflow-hidden bg-gradient-to-br from-gray-900 via-purple-950 to-black p-8 md:p-20">
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 20, repeat: Infinity }}
              className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-purple-500 rounded-full blur-[120px]"
            />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/10 text-yellow-400 text-xs font-bold uppercase tracking-widest mb-8 border border-yellow-400/20">
                <Zap className="w-4 h-4 fill-current" /> Deal of the Day
              </div>
              
              <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">
                Sony WH-1000XM5 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  at its lowest ever.
                </span>
              </h2>
              
              <p className="text-xl text-gray-400 mb-12 leading-relaxed max-w-lg">
                Industry-leading noise cancellation, now at a price that's hard to believe. 
                Tracked across 50+ stores, verified by compare_cart AI.
              </p>

              <div className="flex items-center gap-8 mb-12">
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Current Price</p>
                  <p className="text-4xl font-bold text-white">₹24,990</p>
                </div>
                <div className="h-12 w-px bg-gray-800" />
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">You Save</p>
                  <p className="text-4xl font-bold text-green-400">₹10,000</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Magnetic strength={0.2}>
                  <button className="px-10 py-5 rounded-2xl bg-white text-gray-900 font-bold text-lg flex items-center gap-3 hover:scale-105 transition-transform">
                    <ShoppingCart className="w-5 h-5" /> Grab Deal
                  </button>
                </Magnetic>
                <button className="w-14 h-14 rounded-2xl glass border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", damping: 15 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 blur-3xl rounded-full" />
              <img 
                src="https://images.unsplash.com/photo-1618366712277-70f398c2733d?w=800&q=80" 
                alt="Sony Headphones" 
                className="relative z-10 w-full h-auto rounded-[3rem] shadow-2xl"
              />
              
              {/* Floating Timer Badge */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-6 -left-6 glass p-6 rounded-3xl border-white/10 shadow-2xl z-20"
              >
                <div className="flex items-center gap-3 text-white">
                  <Timer className="w-6 h-6 text-yellow-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ends In</p>
                    <p className="text-xl font-bold tabular-nums">04:22:15</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDeal;