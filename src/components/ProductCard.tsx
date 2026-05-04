"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import PurchaseRecorder from './PurchaseRecorder';
import AddToWishlistButton from './AddToWishlistButton';


interface ProductCardProps {
  platform: string;
  price: string;
  discount?: string;
  logo?: string;
  isLowest?: boolean;
  delay?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ platform, price, discount = '', logo = '', isLowest = false, delay = 0 }) => {
  const numericPrice = parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`relative group p-4 rounded-lg glass max-w-[360px] w-full overflow-hidden ${isLowest ? 'border-2 border-purple-500/30' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="h-10 min-w-[56px] rounded-md bg-white/90 p-2 flex items-center justify-center">
          {logo ? <img src={logo} alt={platform} className="h-7 w-auto object-contain" /> : null}
        </div>

        <div className="flex-1 text-right">
          <p className="text-sm font-medium text-slate-300 uppercase tracking-wider">{platform}</p>
          {discount ? <div className="flex items-center justify-end gap-1 text-green-600 font-semibold text-xs">{discount} OFF</div> : null}
        </div>
      </div>

      <h3 className="text-2xl font-bold text-white mb-3 truncate">{price}</h3>

      <div className="flex items-center gap-3">
        <a className="flex-1 py-2 rounded-md bg-white/70 border border-white/40 font-semibold text-slate-900 text-sm flex items-center justify-center gap-2" href="#">
          View Deal <ExternalLink className="w-4 h-4" />
        </a>

        <div className="w-12">
          <AddToWishlistButton title={platform} url={undefined} store={platform} />
        </div>
      </div>

      <div className="mt-3">
        <PurchaseRecorder productName={platform} price={numericPrice} />
      </div>
    </motion.div>
  );
};

export default ProductCard;