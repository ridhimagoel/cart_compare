"use client";

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, type MotionValue } from 'framer-motion';

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
    <div ref={containerRef} className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-40">
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

const Dot = ({
  mouseX,
  mouseY,
}: {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) => {
  const dotRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0.35);

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
        x.set(diffX * power * 0.22);
        y.set(diffY * power * 0.22);
        scale.set(1 + power * 1.2);
        opacity.set(0.28 + power * 0.65);
      } else {
        x.set(0);
        y.set(0);
        scale.set(1);
        opacity.set(0.3);
      }
    };

    const unsubscribeX = mouseX.onChange(update);
    const unsubscribeY = mouseY.onChange(update);

    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [mouseX, mouseY, x, y, scale, opacity]);

  return (
    <div className="flex items-center justify-center">
      <motion.div
        ref={dotRef}
        style={{ x, y, scale, opacity }}
        className="w-1 h-1 bg-purple-400/40 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.35)]"
      />
    </div>
  );
};

export default InteractiveGrid;