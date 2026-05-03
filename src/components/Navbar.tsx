"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import ExpenditureNav from './ExpenditureNav';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Search', href: '/search' },
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
        <div className="relative w-full">
          <div className="absolute inset-0 rounded-lg pointer-events-none blur-2xl opacity-70 bg-gradient-to-r from-indigo-500/20 via-purple-400/10 to-pink-500/20" />
          {/* Dark-mode outside glow */}
          <div className="absolute -inset-2 rounded-2xl pointer-events-none blur-3xl opacity-0 dark:opacity-90 transition-opacity duration-500 bg-gradient-to-r from-indigo-500/20 via-purple-400/12 to-pink-500/20 mix-blend-screen" />
          <div className="absolute inset-0 rounded-lg pointer-events-none">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/6 via-purple-500/6 to-pink-500/6 opacity-60" />
            <div className="absolute inset-0 rounded-lg border border-white/6 dark:border-white/10" />
            <div className="absolute inset-1 rounded-lg bg-slate-900/50 backdrop-blur-sm" />
          </div>
          <div className={`relative z-10 max-w-7xl mx-auto flex items-center justify-between rounded-lg px-4 md:px-6 h-16 transition-all duration-500 flex-nowrap ${
            isScrolled
              ? 'bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-xl'
              : 'bg-transparent/20 backdrop-blur-md'
          }`}>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-3 mr-8 flex-shrink-0 whitespace-nowrap">
              <img src="/brand/compare-cart-mark.svg" alt="compare cart" className="h-10 w-10" />
              <span className="text-white">compare</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 italic font-bold">
                cart
              </span>
            </a>
          </div>
          <div className="hidden md:flex items-center gap-6 px-3 flex-1 justify-center flex-nowrap">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-white hover:text-indigo-200 transition-colors whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <ExpenditureNav />
            <div className="hidden md:flex items-center gap-2">
              {/* login removed per request */}
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6 text-white" />
            </Button>
          </div>
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
              className="m-4 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl p-5 text-white"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <img src="/brand/compare-cart-mark.svg" alt="compare cart" className="h-8 w-8" />
                  <span className="text-xl font-bold tracking-tight text-white">compare</span>
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 italic">cart</span>
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
                        className="h-12 px-4 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold flex items-center hover:bg-slate-700 hover:text-purple-300 transition-colors whitespace-nowrap"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </div>

              <div className="mt-5" />
              {/* login removed per request */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;