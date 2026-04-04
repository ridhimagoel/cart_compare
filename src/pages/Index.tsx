"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import BackgroundBlobs from '@/components/BackgroundBlobs';
import ProductCard from '@/components/ProductCard';
import PriceHistory from '@/components/PriceHistory';
import Features from '@/components/Features';
import CategoryExplorer from '@/components/CategoryExplorer';
import HowItWorks from '@/components/HowItWorks';
import StoreCloud from '@/components/StoreCloud';
import Testimonials from '@/components/Testimonials';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import SearchOverlay from '@/components/SearchOverlay';
import PriceAlertModal from '@/components/PriceAlertModal';
import Magnetic from '@/components/Magnetic';
import InteractiveGrid from '@/components/InteractiveGrid';
import ComparisonTable from '@/components/ComparisonTable';
import MobileApp from '@/components/MobileApp';
import LiveFeed from '@/components/LiveFeed';
import ExtensionShowcase from '@/components/ExtensionShowcase';
import FeaturedDeal from '@/components/FeaturedDeal';
import SavingsCalculator from '@/components/SavingsCalculator';
import VisualSearch from '@/components/VisualSearch';
import TopTicker from '@/components/TopTicker';
import AIAssistant from '@/components/AIAssistant';
import QuickViewModal from '@/components/QuickViewModal';
import PriceTimeline from '@/components/PriceTimeline';
import TrendingDeals from '@/components/TrendingDeals';
import ScrollToTop from '@/components/ScrollToTop';
import WatchlistPreview from '@/components/WatchlistPreview';
import FAQ from '@/components/FAQ';
import { MadeWithDyad } from "@/components/made-with-dyad";

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

        <LiveFeed />
        <StoreCloud />
        <HowItWorks />

        {/* Results Preview Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
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
                Showing real-time results for "iPhone 15 Pro Max - 256GB Titanium"
              </p>
            </div>
            <div className="flex gap-4">
              <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500">Sort by:</span>
                <span className="text-sm font-bold">Lowest Price</span>
              </div>
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
                  Our AI predicts a <span className="font-bold text-white">15% drop</span> in the next 14 days. 
                  We recommend waiting for the upcoming sale.
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

        <TrendingDeals />
        <PriceTimeline />
        <WatchlistPreview />
        <FeaturedDeal />
        <SavingsCalculator />
        <VisualSearch />
        <ExtensionShowcase />
        <ComparisonTable />
        <CategoryExplorer />
        <MobileApp />
        <Features />
        <FAQ />
        <Testimonials />
        <Newsletter />

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-32">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[4rem] overflow-hidden bg-gray-900 p-12 md:p-24 text-center"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-8">
                Ready to save <span className="text-blue-400 italic">thousands?</span>
              </h2>
              <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                Join 2M+ smart shoppers who use Vantage to find the best deals every single day.
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Magnetic strength={0.2}>
                  <button className="px-10 py-5 rounded-2xl bg-white text-gray-900 font-bold text-lg hover:scale-105 transition-transform">
                    Get Started for Free
                  </button>
                </Magnetic>
                <Magnetic strength={0.2}>
                  <button className="px-10 py-5 rounded-2xl glass text-white font-bold text-lg hover:bg-white/10 transition-all">
                    Download Extension
                  </button>
                </Magnetic>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
      <MadeWithDyad />
    </div>
  );
};

export default Index;