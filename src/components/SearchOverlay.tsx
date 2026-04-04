"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Clock, ArrowRight } from 'lucide-react';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");

  const recentSearches = ["iPhone 15 Pro", "Sony WH-1000XM5", "MacBook Air M3", "Nike Air Max"];
  const trending = ["PS5 Slim", "Samsung S24 Ultra", "Dyson Airwrap", "Kindle Paperwhite"];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] glass backdrop-blur-3xl flex flex-col"
        >
          <div className="max-w-5xl mx-auto w-full px-6 pt-20">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4 flex-1">
                <Search className="w-8 h-8 text-purple-600" />
                <input
                  autoFocus
                  placeholder="Search for products, brands, or stores..."
                  className="bg-transparent border-none text-4xl md:text-6xl font-bold tracking-tighter focus:ring-0 w-full placeholder:text-gray-300"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={onClose}
                className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-6 text-gray-400 font-bold uppercase tracking-widest text-xs">
                  <Clock className="w-4 h-4" /> Recent Searches
                </div>
                <div className="space-y-4">
                  {recentSearches.map((item, i) => (
                    <button key={i} className="flex items-center justify-between w-full group text-2xl font-medium hover:text-purple-600 transition-colors">
                      {item}
                      <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-6 text-gray-400 font-bold uppercase tracking-widest text-xs">
                  <TrendingUp className="w-4 h-4" /> Trending Now
                </div>
                <div className="flex flex-wrap gap-3">
                  {trending.map((item, i) => (
                    <button key={i} className="px-6 py-3 rounded-2xl bg-white/50 border border-gray-100 hover:border-purple-200 hover:bg-white transition-all font-medium">
                      {item}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;