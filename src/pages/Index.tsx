"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import BackgroundBlobs from '@/components/BackgroundBlobs';
import ProductCard from '@/components/ProductCard';
import PriceHistory from '@/components/PriceHistory';
import StoreCloud from '@/components/StoreCloud';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import SearchOverlay from '@/components/SearchOverlay';
import PriceAlertModal from '@/components/PriceAlertModal';
import Magnetic from '@/components/Magnetic';
import InteractiveGrid from '@/components/InteractiveGrid';
import LiveFeed from '@/components/LiveFeed';
import ExtensionShowcase from '@/components/ExtensionShowcase';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import ComparisonTable from '@/components/ComparisonTable';
import TopTicker from '@/components/TopTicker';
import AIAssistant from '@/components/AIAssistant';
import QuickViewModal from '@/components/QuickViewModal';
import ScrollToTop from '@/components/ScrollToTop';
import FAQ from '@/components/FAQ';

const Index = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  return (
    <div className="min-h-screen selection:bg-purple-200">
      <TopTicker />
      <InteractiveGrid />
      <BackgroundBlobs />
      <Navbar />
      
      {/* Global Overlays */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <PriceAlertModal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} />
      <QuickViewModal 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
        product={selectedProduct}
      />
      <AIAssistant />
      <ScrollToTop />

      <main>
        {/* Hero with Search Trigger */}
        <div onClick={() => setIsSearchOpen(true)} className="cursor-pointer">
          <Hero />
        </div>

        <StoreCloud />

        <section id="how-it-works">
          <HowItWorks />
        </section>

        {/* Core Comparison Section */}
        <section id="live-comparisons" className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="max-w-xl">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-5xl font-bold tracking-tighter mb-4"
              >
                Live <span className="text-gradient">Comparisons</span>
              </motion.h2>
              <p className="text-lg text-gray-600">
                Example comparison for "iPhone 15 Pro Max - 256GB" with live pricing snapshots.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div 
              className="product-card cursor-pointer"
              onClick={() => handleProductClick({
                name: "iPhone 15 Pro Max",
                price: "₹1,44,900",
                platform: "Amazon",
                img: "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80"
              })}
            >
              <ProductCard 
                platform="Amazon" 
                price="₹1,44,900" 
                discount="12%" 
                logo="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"
                isLowest
                delay={0.1}
              />
            </div>
            <div 
              className="product-card cursor-pointer"
              onClick={() => handleProductClick({
                name: "iPhone 15 Pro Max",
                price: "₹1,48,900",
                platform: "Flipkart",
                img: "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80"
              })}
            >
              <ProductCard 
                platform="Flipkart" 
                price="₹1,48,900" 
                discount="8%" 
                logo="https://upload.wikimedia.org/wikipedia/commons/7/7a/Flipkart_logo.svg"
                delay={0.2}
              />
            </div>
            <div 
              className="product-card cursor-pointer"
              onClick={() => handleProductClick({
                name: "iPhone 15 Pro Max",
                price: "₹1,52,900",
                platform: "Reliance Digital",
                img: "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80"
              })}
            >
              <ProductCard 
                platform="Reliance Digital" 
                price="₹1,52,900" 
                discount="5%" 
                logo="https://upload.wikimedia.org/wikipedia/commons/b/b8/Reliance_Digital_logo.svg"
                delay={0.3}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <PriceHistory />
            </div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="glass p-8 rounded-[2.5rem] flex flex-col justify-between bg-gradient-to-br from-purple-600 to-blue-700 text-white border-none"
            >
              <div>
                <h3 className="text-3xl font-bold mb-4">Price Prediction</h3>
                <p className="text-purple-100 leading-relaxed">
                  Current trend indicates this product may drop by <span className="font-bold text-white">up to 15%</span> in the next 2 weeks.
                  Set an alert and buy at your target price.
                </p>
              </div>
              <Magnetic strength={0.3}>
                <button 
                  onClick={() => setIsAlertOpen(true)}
                  className="w-full py-4 rounded-2xl bg-white text-purple-600 font-bold hover:bg-purple-50 transition-colors"
                >
                  Set Price Alert
                </button>
              </Magnetic>
            </motion.div>
          </div>
        </section>

        <section id="features">
          <Features />
        </section>

        <section id="comparison-table">
          <ComparisonTable />
        </section>

        <LiveFeed />

        <ExtensionShowcase />
        <FAQ />
        <Newsletter />
      </main>

      <Footer />
    </div>
  );
};

export default Index;