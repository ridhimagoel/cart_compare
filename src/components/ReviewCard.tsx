"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle2, Quote, TrendingDown } from 'lucide-react';

interface ReviewCardProps {
  name: string;
  role: string;
  content: string;
  savings: string;
  product: string;
  avatar: string;
  rating: number;
  delay?: number;
}

const ReviewCard = ({ name, role, content, savings, product, avatar, rating, delay = 0 }: ReviewCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="glass p-8 rounded-[2.5rem] relative group hover:bg-white/60 transition-all duration-500"
    >
      <Quote className="absolute top-6 right-8 w-12 h-12 text-purple-100 group-hover:text-purple-200 transition-colors" />
      
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <img src={avatar} alt={name} className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover" />
          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-0.5 rounded-full border-2 border-white">
            <CheckCircle2 className="w-3 h-3" />
          </div>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            {name}
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Verified Win</span>
          </h4>
          <p className="text-xs text-gray-500 font-medium">{role}</p>
        </div>
      </div>

      <div className="flex text-yellow-400 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-current' : 'text-gray-200'}`} />
        ))}
      </div>

      <p className="text-gray-600 leading-relaxed mb-6 italic">"{content}"</p>

      <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Saved on {product}</div>
        <div className="flex items-center gap-1 text-green-600 font-black text-lg">
          <TrendingDown className="w-4 h-4" />
          {savings}
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewCard;