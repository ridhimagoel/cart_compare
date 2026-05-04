"use client";

import React from 'react';

const PriceDropHero: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 mb-8">
      <div className="rounded-[2.5rem] bg-gradient-to-br from-black/60 via-purple-900/60 to-black/60 border border-white/5 p-12 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm font-bold text-purple-300 uppercase tracking-wider mb-4">Weekly Deal Digest</span>
          <h3 className="text-5xl md:text-6xl font-bold text-white tracking-tight">Never miss a <span className="text-gradient">price drop.</span></h3>
          <p className="text-lg text-slate-300 mt-4">Get a weekly summary of meaningful price drops, handpicked deals, and buying tips. Clear, useful, and spam-free.</p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <input type="email" placeholder="Enter your email" className="rounded-xl px-6 py-3 bg-white/5 placeholder:text-slate-400 text-white outline-none" />
            <button className="rounded-xl bg-purple-600 text-white px-6 py-3 font-semibold hover:opacity-95">Get Weekly Deals</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PriceDropHero;
