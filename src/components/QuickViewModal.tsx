"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Bell, Share2, Star, ShieldCheck } from 'lucide-react';
import Magnetic from './Magnetic';

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    name: string;
    price: string;
    img: string;
    platform: string;
  } | null;
}

const QuickViewModal = ({ isOpen, onClose, product }: QuickViewModalProps) => {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl glass rounded-[3rem] overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-colors z-20"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-12 bg-white/50 flex items-center justify-center relative">
              <motion.img 
                layoutId={`img-${product.name}`}
                src={product.img} 
                alt={product.name} 
                className="w-full h-auto max-h-[400px] object-contain drop-shadow-2xl"
              />
              <div className="absolute bottom-8 left-12 flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-16 h-16 rounded-2xl bg-white border border-gray-100 p-2 cursor-pointer hover:border-purple-500 transition-colors">
                    <img src={product.img} className="w-full h-full object-contain opacity-50" />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-12 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <span className="text-sm font-bold text-gray-500">4.9 (4.2k reviews)</span>
              </div>

              <h2 className="text-4xl font-bold tracking-tighter mb-2">{product.name}</h2>
              <p className="text-gray-500 mb-8">Sold by <span className="font-bold text-gray-900">{product.platform}</span> • Verified Seller</p>

              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-5xl font-bold text-gray-900">{product.price}</span>
                <span className="text-xl text-gray-400 line-through">₹1,59,900</span>
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-bold">SAVE 12%</span>
              </div>

              <div className="space-y-4 mb-12">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <ShieldCheck className="w-5 h-5 text-blue-500" /> 1 Year Manufacturer Warranty
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <ShoppingCart className="w-5 h-5 text-purple-500" /> Free Express Delivery
                </div>
              </div>

              <div className="flex gap-4">
                <Magnetic strength={0.2}>
                  <button className="flex-1 h-16 rounded-2xl bg-gray-900 text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-800 transition-all">
                    Buy Now <ShoppingCart className="w-5 h-5" />
                  </button>
                </Magnetic>
                <button className="w-16 h-16 rounded-2xl glass border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all">
                  <Bell className="w-6 h-6" />
                </button>
                <button className="w-16 h-16 rounded-2xl glass border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;