"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 ${
        isScrolled ? 'py-3' : 'py-6'
      }`}
    >
      <div className={`max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 ${
        isScrolled ? 'glass shadow-lg' : 'bg-transparent'
      }`}>
        <div className="flex items-center gap-8">
          <a href="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg rotate-12" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Vantage</span>
          </a>
          
          <div className="hidden md:flex items-center gap-6">
            {['Deals', 'Categories', 'Price Alerts', 'Extension'].map((item) => (
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
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/50">
            <Search className="w-5 h-5" />
          </Button>
          <Button className="rounded-full bg-gray-900 text-white hover:bg-gray-800 px-6">
            Sign In
          </Button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;