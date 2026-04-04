"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Tag, ExternalLink } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface CouponCardProps {
  store: string;
  code: string;
  discount: string;
  desc: string;
  logo: string;
  expiry: string;
}

const CouponCard = ({ store, code, discount, desc, logo, expiry }: CouponCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showSuccess(`Code ${code} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass p-6 rounded-[2rem] relative overflow-hidden group border-dashed border-2 border-gray-200 hover:border-purple-400 transition-colors"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="w-12 h-12 rounded-xl bg-white p-2 shadow-sm">
          <img src={logo} alt={store} className="w-full h-full object-contain" />
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-purple-600 tracking-tighter">{discount}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">OFF ANY ORDER</div>
        </div>
      </div>

      <h4 className="font-bold text-gray-900 mb-2">{desc}</h4>
      <p className="text-xs text-gray-500 mb-6 flex items-center gap-1">
        <Tag className="w-3 h-3" /> Expires: {expiry}
      </p>

      <div className="relative">
        <button
          onClick={handleCopy}
          className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between px-4 group-hover:bg-white transition-colors"
        >
          <span className="font-mono font-bold text-gray-900">{code}</span>
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check className="w-4 h-4 text-green-600" />
              </motion.div>
            ) : (
              <Copy className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
            )}
          </AnimatePresence>
        </button>
      </div>

      <div className="mt-4 flex justify-center">
        <button className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 flex items-center gap-1">
          Shop {store} <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

export default CouponCard;