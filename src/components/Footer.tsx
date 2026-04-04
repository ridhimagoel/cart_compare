"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Twitter, Instagram, Github, Linkedin, ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    Product: ['Price Tracker', 'Browser Extension', 'Mobile App', 'Price Alerts', 'Verified Coupons'],
    Company: ['About Us', 'Careers', 'Press Kit', 'Contact', 'Partners'],
    Resources: ['Help Center', 'Shopping Guides', 'Market Trends', 'API Documentation', 'Community'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security', 'Disclaimer']
  };

  return (
    <footer className="relative pt-24 pb-12 px-6 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
          <div className="lg:col-span-2">
            <a href="/" className="text-3xl font-bold tracking-tighter flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl rotate-12" />
              <span>Vantage</span>
            </a>
            <p className="text-lg text-gray-500 max-w-sm leading-relaxed mb-8">
              The world's most advanced price tracking engine. We help millions of shoppers save time and money every day through AI-powered insights.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-gray-500">
                <Mail className="w-5 h-5 text-purple-600" />
                <span>hello@vantage.sh</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <MapPin className="w-5 h-5 text-purple-600" />
                <span>San Francisco, CA • Bangalore, IN</span>
              </div>
            </div>
            <div className="flex gap-4">
              {[Twitter, Instagram, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all duration-300">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-xs">{title}</h4>
              <ul className="space-y-4">
                {links.map(item => (
                  <li key={item}>
                    <a href="#" className="text-gray-500 hover:text-purple-600 flex items-center gap-1 group transition-colors text-sm font-medium">
                      {item} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-gray-400 text-sm">© 2024 Vantage Technologies Inc.</p>
            <div className="flex gap-6">
              <a href="#" className="text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest">Status</a>
              <a href="#" className="text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest">Privacy</a>
              <a href="#" className="text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest">Terms</a>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            All Systems Operational
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;