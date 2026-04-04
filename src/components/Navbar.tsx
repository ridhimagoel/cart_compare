"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, Zap } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Deals', href: '#deals' },
    { name: 'Features', href: '#features' },
    { name: 'Price History', href: '#' },
    { name: 'Guides', href: '#' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'py-4' : 'py-8'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`relative flex items-center justify-between p-2 rounded-full transition-all duration-300 ${
          isScrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg border border-white/20' : 'bg-transparent'
        }`}>
          {/* Logo */}
          <div className="flex items-center gap-2 pl-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-gray-900">VANTAGE</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors uppercase tracking-widest"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pr-2">
            <button className="p-3 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
              <Search className="w-5 h-5" />
            </button>
            <button className="hidden md:block px-6 py-3 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-blue-600 transition-all">
              Get Started
            </button>
            <button 
              className="md:hidden p-3 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 p-6 md:hidden shadow-2xl"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-lg font-bold text-gray-900 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold mt-4">
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;