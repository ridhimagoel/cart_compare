"use client";

import React from 'react';
import { motion } from 'framer-motion';

const BackgroundBlobs = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 noise-overlay" />
      
      {/* Primary Blobs */}
      <motion.div
        animate={{
          x: [0, 150, -50, 0],
          y: [0, 100, 50, 0],
          scale: [1, 1.4, 0.8, 1],
          rotate: [0, 45, -45, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[15%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-300/20 animated-blob"
      />
      <motion.div
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 150, -100, 0],
          scale: [1, 1.2, 1.5, 1],
          rotate: [0, -30, 60, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] -right-[15%] w-[50%] h-[50%] rounded-full bg-purple-300/20 animated-blob"
      />
      <motion.div
        animate={{
          x: [0, 100, -150, 0],
          y: [0, -120, 100, 0],
          scale: [1, 1.3, 0.9, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[15%] left-[15%] w-[55%] h-[55%] rounded-full bg-pink-300/15 animated-blob"
      />

      {/* Floating Glass Shards (Decorative) */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            rotate: Math.random() * 360,
            opacity: 0 
          }}
          animate={{ 
            y: ["-10%", "110%"],
            rotate: [0, 360],
            opacity: [0, 0.2, 0]
          }}
          transition={{ 
            duration: 15 + Math.random() * 10, 
            repeat: Infinity, 
            delay: Math.random() * 10,
            ease: "linear"
          }}
          className="absolute w-32 h-32 glass rounded-lg border-white/10"
          style={{ transform: `skew(${Math.random() * 20}deg)` }}
        />
      ))}
    </div>
  );
};

export default BackgroundBlobs;