"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import Magnetic from './Magnetic';

const Newsletter = () => {
  return (
    <section className="py-32 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto glass rounded-[4rem] p-12 md:p-20 relative overflow-hidden text-center"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-600 text-xs font-bold uppercase tracking-widest mb-8">
            <Sparkles className="w-4 h-4" /> Weekly Deal Digest
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            Never miss a <span className="text-gradient">price drop.</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Join our newsletter and get the best deals of the week delivered straight to your inbox. No spam, just savings.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 h-14 px-6 rounded-2xl glass border-gray-200 focus:border-purple-500 focus:ring-0 text-lg transition-all"
            />
            <Magnetic strength={0.2}>
              <button className="h-14 px-8 rounded-2xl bg-gray-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95">
                Subscribe <Send className="w-4 h-4" />
              </button>
            </Magnetic>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Newsletter;