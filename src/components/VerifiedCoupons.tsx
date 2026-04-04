"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Ticket, Sparkles } from 'lucide-react';
import CouponCard from './CouponCard';

const coupons = [
  {
    store: "Amazon",
    code: "AMZTECH20",
    discount: "₹2,000",
    desc: "Extra discount on select laptops",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    expiry: "24 Oct 2024"
  },
  {
    store: "Flipkart",
    code: "FKFESTIVE",
    discount: "10%",
    desc: "Instant discount on HDFC cards",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Flipkart_logo.svg",
    expiry: "30 Oct 2024"
  },
  {
    store: "Myntra",
    code: "MYNNEW500",
    discount: "₹500",
    desc: "Flat off on your first purchase",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_logo.png",
    expiry: "31 Dec 2024"
  },
  {
    store: "Reliance",
    code: "RELSMART",
    discount: "₹1,500",
    desc: "Off on smartphones above ₹20k",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Reliance_Digital_logo.svg",
    expiry: "15 Nov 2024"
  }
];

const VerifiedCoupons = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-bold uppercase tracking-widest mb-4">
              <Ticket className="w-3 h-3" /> Verified Codes
            </div>
            <h2 className="text-5xl font-bold tracking-tighter mb-4">
              Stack your <span className="text-gradient">Savings</span>
            </h2>
            <p className="text-lg text-gray-600">
              We've verified these promo codes to work with the current lowest prices.
            </p>
          </div>
          <button className="text-sm font-bold text-purple-600 hover:underline flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Auto-apply with Extension
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coupons.map((coupon, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <CouponCard {...coupon} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VerifiedCoupons;