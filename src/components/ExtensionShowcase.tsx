"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Sparkles, MousePointer2 } from 'lucide-react';

const ExtensionShowcase = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="order-2 lg:order-1">
          <div className="relative">
            {/* Mock Browser Window */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="w-full aspect-[4/3] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden relative"
            >
              {/* Browser Header */}
              <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 max-w-md mx-auto h-7 bg-white rounded-md border border-gray-200 flex items-center px-3 gap-2">
                  <Search className="w-3 h-3 text-gray-400" />
                  <div className="text-[10px] text-gray-400">amazon.in/iphone-15-pro</div>
                </div>
              </div>

              {/* Browser Content (Mock Amazon) */}
              <div className="p-8 opacity-40">
                <div className="w-1/2 h-8 bg-gray-200 rounded-lg mb-4" />
                <div className="flex gap-8">
                  <div className="w-1/3 aspect-square bg-gray-100 rounded-2xl" />
                  <div className="flex-1 space-y-4">
                    <div className="w-full h-4 bg-gray-100 rounded-full" />
                    <div className="w-full h-4 bg-gray-100 rounded-full" />
                    <div className="w-2/3 h-4 bg-gray-100 rounded-full" />
                    <div className="w-1/2 h-10 bg-gray-900 rounded-xl" />
                  </div>
                </div>
              </div>

              {/* Vantage Extension Popup */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute top-16 right-8 w-64 glass p-6 rounded-2xl shadow-2xl border-purple-500/30 border-2 z-20"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-md rotate-12" />
                  <span className="font-bold text-sm">Vantage AI</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">Better Deal Found!</p>
                    <p className="text-sm font-bold text-gray-900">Save ₹4,500 at Flipkart</p>
                  </div>
                  <button className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors">
                    Go to Deal
                  </button>
                </div>
              </motion.div>

              {/* Floating Cursor Animation */}
              <motion.div
                animate={{
                  x: [200, 450, 450],
                  y: [300, 150, 150],
                }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                className="absolute z-30 text-purple-600"
              >
                <MousePointer2 className="w-8 h-8 fill-current" />
              </motion.div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl -z-10" />
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-600 text-xs font-bold uppercase tracking-widest mb-8">
              <Sparkles className="w-4 h-4" /> Magic Extension
            </div>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-8">
              Savings that <span className="text-gradient">follow you.</span>
            </h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Our browser extension works silently in the background. When you're on any shopping site, 
              we'll automatically pop up if we find a better price elsewhere.
            </p>
            
            <div className="space-y-6">
              {[
                { title: "Auto-Compare", desc: "Instantly scans 50+ stores while you browse.", icon: Search },
                { title: "Verified Coupons", desc: "Automatically applies the best promo codes at checkout.", icon: ShieldCheck },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ExtensionShowcase;