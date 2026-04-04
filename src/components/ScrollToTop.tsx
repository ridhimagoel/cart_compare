"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalHeight) * 100;
      setProgress(currentProgress);
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-8 left-8 z-[100] w-14 h-14 rounded-full glass flex items-center justify-center shadow-2xl group"
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-100"
            />
            <motion.circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="150.796"
              strokeDashoffset={150.796 - (150.796 * progress) / 100}
              className="text-purple-600"
            />
          </svg>
          <ArrowUp className="w-5 h-5 text-gray-900 group-hover:-translate-y-1 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;