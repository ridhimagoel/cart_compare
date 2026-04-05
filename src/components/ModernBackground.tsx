"use client";

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ModernBackground = () => {
  const { scrollYProgress } = useScroll();
  
  // Parallax effects for floating elements
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#fafafa]">
      {/* Subtle Noise Overlay */}
      <div className="absolute inset-0 noise-bg" />

      {/* Animated Mesh Gradients */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-100/40 to-purple-100/40 blur-[120px]"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -40, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-pink-100/30 to-orange-100/30 blur-[100px]"
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 20, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[10%] left-[10%] w-[55%] h-[55%] rounded-full bg-gradient-to-tr from-blue-100/30 to-cyan-100/30 blur-[110px]"
      />

      {/* Floating Glass Orbs (Parallax) */}
      <motion.div 
        style={{ y: y1, rotate }}
        className="absolute top-[15%] left-[10%] w-32 h-32 rounded-3xl bg-white/20 border border-white/40 backdrop-blur-sm shadow-xl"
      />
      
      <motion.div 
        style={{ y: y2, rotate: -20 }}
        className="absolute bottom-[20%] right-[15%] w-48 h-48 rounded-full bg-white/10 border border-white/30 backdrop-blur-md shadow-2xl"
      />

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]" />
    </div>
  );
};

export default ModernBackground;