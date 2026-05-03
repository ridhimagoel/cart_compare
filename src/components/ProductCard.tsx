"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PurchaseRecorder from './PurchaseRecorder';

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

      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="h-12 min-w-[74px] rounded-2xl bg-white/90 px-2.5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
          <img src={logo} alt={platform} className="h-8 w-auto max-w-[64px] object-contain" />
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-300 uppercase tracking-wider">{platform}</p>
          <div className="flex items-center gap-1 text-green-600 font-bold text-sm">
            <TrendingDown className="w-4 h-4" />
            {discount} OFF
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-4xl font-bold tracking-tighter text-white">{price}</h3>
        {/* ratings removed per request */}
      </div>

      <button className="w-full py-4 rounded-2xl bg-white/65 border border-white/60 font-bold text-slate-900 flex items-center justify-center gap-2 group-hover:bg-white group-hover:text-black transition-all duration-300">
        View Deal <ExternalLink className="w-4 h-4" />
      </button>
      <PurchaseRecorder
        productName={platform}
        price={parseFloat(price.replace(/[^\d.]/g, ''))}
      />
    </motion.div>
  );
};

export default ProductCard;