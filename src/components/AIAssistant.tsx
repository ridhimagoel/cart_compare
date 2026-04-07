"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Bot } from 'lucide-react';
import Magnetic from './Magnetic';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 w-[350px] glass rounded-[2.5rem] shadow-2xl overflow-hidden border-purple-500/20 border-2"
          >
            <div className="p-6 bg-gradient-to-br from-purple-600 to-blue-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">compare_cart AI</h4>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium opacity-80">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Online & Ready to help
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm opacity-90 leading-relaxed">
                "Hi! I'm your personal shopping assistant. Ask me to find the best deals or predict price drops!"
              </p>
            </div>

            <div className="p-6 h-64 overflow-y-auto space-y-4 bg-white/50">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700">
                  I've found a 15% price drop on Sony Headphones. Should I show you?
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                <input 
                  placeholder="Ask anything..." 
                  className="w-full h-12 pl-4 pr-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <button className="absolute right-2 w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Magnetic strength={0.3}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
            isOpen ? 'bg-gray-900 text-white rotate-90' : 'bg-gradient-to-tr from-blue-600 to-purple-600 text-white'
          }`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </Magnetic>
    </div>
  );
};

export default AIAssistant;