"use client";

import React from 'react';
import { motion } from 'framer-motion';
import ReviewCard from './ReviewCard';

const reviews = [
  {
    name: "Arjun K.",
    role: "Gadget Enthusiast",
    content: "I was about to buy the PS5 at full price, but compare_cart alerted me to a flash sale on Reliance Digital. Saved enough for two extra games!",
    savings: "₹6,500",
    product: "Sony PS5 Slim",
    avatar: "https://i.pravatar.cc/150?u=arjun",
    rating: 5
  },
  {
    name: "Priya S.",
    role: "Fashion Blogger",
    content: "The price history graph is my best friend. I waited 2 weeks for these sneakers to hit their lowest price ever. Totally worth the wait!",
    savings: "₹3,200",
    product: "Nike Air Jordan 1",
    avatar: "https://i.pravatar.cc/150?u=priya",
    rating: 5
  },
  {
    name: "Marcus T.",
    role: "Remote Developer",
    content: "compare_cart found a coupon code I didn't even know existed. The browser extension is pure magic. It just works in the background.",
    savings: "₹12,000",
    product: "MacBook Air M3",
    avatar: "https://i.pravatar.cc/150?u=marcus",
    rating: 4
  }
];

const CommunityWins = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6">
            Real People. <span className="text-gradient italic">Real Savings.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of shoppers who are beating the retailers at their own game.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <ReviewCard key={i} {...review} delay={i * 0.1} />
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <button className="px-8 py-4 rounded-2xl glass border-gray-200 font-bold text-gray-900 hover:bg-gray-900 hover:text-white transition-all">
            Read All 2,400+ Reviews
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default CommunityWins;