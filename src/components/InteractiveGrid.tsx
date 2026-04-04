"use client";

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const InteractiveGrid = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 100 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      mouseX.set(clientX);
      mouseY.set(clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Create a grid of dots
  const dots = [];
  const rows = 20;
  const cols = 30;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      dots.push({ id: `${i}-${j}`, x: (j / cols) * 100, y: (i / rows) * 100 });
    }
  }

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-30">
      <div className="absolute inset-0 grid grid-cols-[repeat(30,1fr)] grid-rows-[repeat(20,1fr)]">
        {dots.map((dot) => (
          <Dot key={dot.id} mouseX={mouseXSpring} mouseY={mouseYSpring} />
        ))}
      </div>
      
      {/* Subtle spotlight glow */}
      <motion.div
        style={{
          x: mouseXSpring,
          y: mouseYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]"
      />
    </div>
  );
};

const Dot = ({ mouseX, mouseY }: { mouseX: any, mouseY: any }) => {
  const dotRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const update = () => {
      if (!dotRef.current) return;
      const rect = dotRef.current.getBoundingClientRect();
      const dotX = rect.left + rect.width / 2;
      const dotY = rect.top + rect.height / 2;

      const diffX = mouseX.get() - dotX;
      const diffY = mouseY.get() - dotY;
      const distance = Math.sqrt(diffX * diffX + diffY * diffY);
      
      const maxDist = 300;
      if (distance < maxDist) {
        const power = (maxDist - distance) / maxDist;
        x.set(diffX * power * 0.2);
        y.set(diffY * power * 0.2);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const unsubscribeX = mouseX.onChange(update);
    const unsubscribeY = mouseY.onChange(update);

    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [mouseX, mouseY, x, y]);

  return (
    <div className="flex items-center justify-center">
      <motion.div
        ref={dotRef}
        style={{ x, y }}
        className="w-1 h-1 bg-purple-400/40 rounded-full"
      />
    </div>
  );
};

export default InteractiveGrid;