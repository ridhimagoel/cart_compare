"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const reviews = [
  { name: "Sarah J.", role: "Tech Enthusiast", text: "Vantage saved me ₹12,000 on my new MacBook. The price history graph is a game changer!", avatar: "https://i.pravatar.cc/150?u=sarah" },
  { name: "Rahul M.", role: "Smart Shopper", text: "I used to check 5 tabs manually. Now I just use Vantage. It's faster and much more beautiful.", avatar: "https://i.pravatar.cc/150?u=rahul" },
  { name: "Elena K.", role: "Fashion Blogger", text: "The price alerts are so reliable. I got my dream sneakers at their lowest price ever.", avatar: "https://i.pravatar.cc/150?u=elena" },
  { name: "David W.", role: "Gadget Reviewer", text: "The UI is incredible. It feels like using a premium Apple product. Highly recommended.", avatar: "https://i.pravatar.cc/150?u=david" },
];

const Testimonials = () => {
  return (
    <section className="py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <h2 className="text-5xl font-bold tracking-tighter">Loved by <span className="text-gradient">thousands.</span></h2>
      </div>

      <div className="flex gap-6 px-6">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-6"
        >
          {[...reviews, ...reviews].map((review, i) => (
            <div 
              key={i}
              className="w-[400px] flex-shrink-0 glass p-8 rounded-[2.5rem] relative group hover:bg-white/60 transition-colors duration-500"
            >
              <Quote className="absolute top-6 right-8 w-12 h-12 text-purple-100 group-hover:text-purple-200 transition-colors" />
              <div className="flex items-center gap-4 mb-6">
                <img src={review.avatar} alt={review.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                <div>
                  <h4 className="font-bold text-gray-900">{review.name}</h4>
                  <p className="text-xs text-gray-500 font-medium">{review.role}</p>
                </div>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed italic">"{review.text}"</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;