"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, TrendingDown, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  platform: string;
  price: string;
  discount: string;
  logo: string;
  isLowest?: boolean;
  delay?: number;
}

const ProductCard = ({ platform, price, discount, logo, isLowest, delay = 0 }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -10, scale: 1.02 }}
      className={`relative group p-6 rounded-3xl glass transition-all duration-500 ${
        isLowest ? 'border-2 border-purple-500/30 shadow-2xl shadow-purple-500/10' : ''
      }`}
    >
      {isLowest && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none px-4 py-1 shadow-lg">
            Best Price
          </Badge>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
          <img src={logo} alt={platform} className="w-8 h-8 object-contain" />
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{platform}</p>
          <div className="flex items-center gap-1 text-green-600 font-bold text-sm">
            <TrendingDown className="w-4 h-4" />
            {discount} OFF
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-4xl font-bold tracking-tighter text-gray-900">{price}</h3>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
          </div>
          <span className="text-xs text-gray-500 font-medium">4.8 (2.4k reviews)</span>
        </div>
      </div>

      <button className="w-full py-4 rounded-2xl bg-white/50 border border-gray-200 font-bold text-gray-900 flex items-center justify-center gap-2 group-hover:bg-gray-900 group-hover:text-white transition-all duration-300">
        View Deal <ExternalLink className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default ProductCard;