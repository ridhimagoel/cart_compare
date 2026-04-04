"use client";

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = ['Deals', 'Categories', 'Price Alerts', 'Extension'];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 ${
          isScrolled ? 'py-3' : 'py-6'
        }`}
      >
        <div className={`max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 relative overflow-hidden ${
          isScrolled ? 'glass shadow-lg' : 'bg-transparent'
        }`}>
          {/* Scroll Progress Bar */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 to-purple-600 origin-left"
            style={{ scaleX }}
          />

          <div className="flex items-center gap-8">
            <a href="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg rotate-12" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Vantage</span>
            </a>
            
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <a 
                  key={item} 
                  href="#" 
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/50 hidden sm:flex">
              <Search className="w-5 h-5" />
            </Button>
            <Button className="rounded-full bg-gray-900 text-white hover:bg-gray-800 px-6 hidden sm:flex">
              Sign In
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] glass backdrop-blur-2xl md:hidden"
          >
            <div className="p-8 flex flex-col h-full">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg rotate-12" />
                  <span className="text-2xl font-bold tracking-tighter">Vantage</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex flex-col gap-8">
                {navItems.map((item, i) => (
                  <motion.a
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    href="#"
                    className="text-4xl font-bold tracking-tighter hover:text-purple-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item}
                  </motion.a>
                ))}
              </div>

              <div className="mt-auto space-y-4">
                <Button className="w-full h-16 rounded-2xl bg-gray-900 text-white text-lg font-bold">
                  Sign In
                </Button>
                <Button variant="outline" className="w-full h-16 rounded-2xl border-2 text-lg font-bold">
                  Create Account
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;