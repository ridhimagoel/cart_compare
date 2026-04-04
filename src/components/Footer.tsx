"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Twitter, Instagram, Github, ArrowUpRight } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative pt-32 pb-12 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2">
            <a href="/" className="text-3xl font-bold tracking-tighter flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl rotate-12" />
              <span>Vantage</span>
            </a>
            <p className="text-xl text-gray-500 max-w-md leading-relaxed mb-8">
              The next generation of price comparison. 
              Built for the modern shopper who values time and money.
            </p>
            <div className="flex gap-4">
              {[Twitter, Instagram, Github].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all duration-300">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6">Product</h4>
            <ul className="space-y-4">
              {['Features', 'Extension', 'Mobile App', 'API'].map(item => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 group">
                    {item} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6">Company</h4>
            <ul className="space-y-4">
              {['About', 'Careers', 'Privacy', 'Terms'].map(item => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 group">
                    {item} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="pt-12 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-sm">© 2024 Vantage Technologies. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Status: Operational
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;