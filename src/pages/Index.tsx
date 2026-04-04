"use client";

import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeaturedDeal from '../components/FeaturedDeal';
import FeatureCards from '../components/FeatureCards';

const Index = () => {
  return (
    <main className="min-h-screen bg-[#FDFCFB] selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      
      {/* Hero Section with Search */}
      <Hero />

      {/* Featured Deal Section */}
      <div id="deals">
        <FeaturedDeal />
      </div>

      {/* Feature Cards Section */}
      <FeatureCards />

      {/* Simple Footer */}
      <footer className="py-20 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">V</span>
            </div>
            <span className="font-black tracking-tighter text-gray-900">VANTAGE</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 Vantage AI. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">Privacy</a>
            <a href="#" className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Index;