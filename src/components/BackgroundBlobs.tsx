"use client";

import React from 'react';
import { motion } from 'framer-motion';

const BackgroundBlobs = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-200/30 animated-blob"
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 120, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 animated-blob"
      />
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full bg-pink-200/20 animated-blob"
      />
    </div>
  );
};

export default BackgroundBlobs;