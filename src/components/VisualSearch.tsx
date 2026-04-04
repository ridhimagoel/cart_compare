"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Upload, Search, Sparkles } from 'lucide-react';

const VisualSearch = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest mb-8">
            <Sparkles className="w-4 h-4" /> AI Powered
          </div>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-8">
            Search with <span className="italic text-gradient">Vision.</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Found something you love on Instagram or in a store? Just snap a photo or upload a screenshot. 
            Our AI identifies the product and finds the best price instantly.
          </p>
          
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Upload Image</h4>
                <p className="text-gray-500">Drag and drop any product image to start.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <Search className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Instant Match</h4>
                <p className="text-gray-500">We scan millions of products to find an exact match.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-[3rem] p-12 aspect-square flex flex-col items-center justify-center border-dashed border-2 border-gray-200 group hover:border-purple-400 transition-colors cursor-pointer"
          >
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 rounded-3xl bg-purple-100 flex items-center justify-center text-purple-600 mb-8 group-hover:scale-110 transition-transform"
            >
              <Upload className="w-10 h-10" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">Drop image here</h3>
            <p className="text-gray-500 mb-8">or click to browse files</p>
            
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
              <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
              <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
            </div>

            {/* Scanning Animation Overlay */}
            <motion.div 
              initial={{ top: "0%" }}
              animate={{ top: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default VisualSearch;