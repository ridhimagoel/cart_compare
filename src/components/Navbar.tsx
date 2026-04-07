"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Live Comparisons', href: '#live-comparisons' },
    { label: 'Extension', href: '#extension' },
    { label: 'FAQ', href: '#faq' }
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-6 ${
          isScrolled ? 'py-3' : 'py-5'
        }`}
      >
        <div className={`max-w-7xl mx-auto flex items-center justify-between rounded-full px-4 md:px-6 h-16 border transition-all duration-500 ${
          isScrolled
            ? 'bg-white/85 backdrop-blur-xl border-gray-200/90 shadow-xl shadow-black/5'
            : 'bg-white/70 backdrop-blur-md border-white/70'
        }`}>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
              <img src="/brand/compare-cart-mark.svg" alt="compare cart" className="h-8 w-8" />
              <span className="text-gray-900">compare</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 italic font-bold">
                cart
              </span>
            </a>
          </div>

          <div className="hidden md:flex items-center gap-1 rounded-full bg-gray-50/80 border border-gray-100 px-2 py-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button className="hidden sm:inline-flex rounded-full bg-gray-900 text-white hover:bg-black px-5">
              Get Started <ArrowUpRight className="w-4 h-4 ml-1" />
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
            className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm md:hidden"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="m-4 rounded-3xl bg-white border border-gray-200 shadow-2xl p-5"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <img src="/brand/compare-cart-mark.svg" alt="compare cart" className="h-8 w-8" />
                  <span className="text-xl font-bold tracking-tight text-gray-900">compare</span>
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 italic">cart</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {navItems.map((item, i) => (
                  <motion.a
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    href={item.href}
                    className="h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 text-gray-700 font-semibold flex items-center hover:bg-white hover:text-purple-700 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </div>

              <div className="mt-5">
                <Button className="w-full h-12 rounded-xl bg-gray-900 text-white font-semibold">
                  Get Started
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;