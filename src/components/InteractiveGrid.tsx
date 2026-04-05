"use client";

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const InteractiveGrid = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const rows = 15;
  const cols = 25;
  const dots = Array.from({ length: rows * cols }).map((_, i) => ({
    id: i,
    r: Math.floor(i / cols),
    c: i % cols,
  }));

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-40">
      <div className="absolute inset-0 grid grid-cols-[repeat(25,1fr)] grid-rows-[repeat(15,1fr)] p-4">
        {dots.map((dot) => (
          <Dot key={dot.id} mouseX={mouseXSpring} mouseY={mouseYSpring} />
        ))}
      </div>
      
      {/* Dynamic Spotlight */}
      <motion.div
        style={{
          x: mouseXSpring,
          y: mouseYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="absolute w-[800px] h-[800px] bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-[150px]"
      />
    </div>
  );
};

const Dot = ({ mouseX, mouseY }: { mouseX: any, mouseY: any }) => {
  const dotRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0.3);

  useEffect(() => {
    const update = () => {
      if (!dotRef.current) return;
      const rect = dotRef.current.getBoundingClientRect();
      const dotX = rect.left + rect.width / 2;
      const dotY = rect.top + rect.height / 2;

      const diffX = mouseX.get() - dotX;
      const diffY = mouseY.get() - dotY;
      const distance = Math.sqrt(diffX * diffX + diffY * diffY);
      
      const maxDist = 400;
      if (distance < maxDist) {
        const power = (maxDist - distance) / maxDist;
        // Magnetic pull effect
        x.set(diffX * power * 0.25);
        y.set(diffY * power * 0.25);
        scale.set(1 + power * 1.5);
        opacity.set(0.3 + power * 0.7);
      } else {
        x.set(0);
        y.set(0);
        scale.set(1);
        opacity.set(0.3);
      }
    };

    const unsubscribeX = mouseX.on("change", update);
    const unsubscribeY = mouseY.on("change", update);

    return () =><dyad-write path="src/components/InteractiveGrid.tsx" description="Upgrading the grid to a more dynamic, warping magnetic field effect.">
"use client";

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const InteractiveGrid = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const rows = 15;
  const cols = 25;
  const dots = Array.from({ length: rows * cols }).map((_, i) => ({
    id: i,
    r: Math.floor(i / cols),
    c: i % cols,
  }));

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-40">
      <div className="absolute inset-0 grid grid-cols-[repeat(25,1fr)] grid-rows-[repeat(15,1fr)] p-4">
        {dots.map((dot) => (
          <Dot key={dot.id} mouseX={mouseXSpring} mouseY={mouseYSpring} />
        ))}
      </div>
      
      {/* Dynamic Spotlight */}
      <motion.div
        style={{
          x: mouseXSpring,
          y: mouseYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="absolute w-[800px] h-[800px] bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-[150px]"
      />
    </div>
  );
};

const Dot = ({ mouseX, mouseY }: { mouseX: any, mouseY: any }) => {
  const dotRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0.3);

  useEffect(() => {
    const update = () => {
      if (!dotRef.current) return;
      const rect = dotRef.current.getBoundingClientRect();
      const dotX = rect.left + rect.width / 2;
      const dotY = rect.top + rect.height / 2;

      const diffX = mouseX.get() - dotX;
      const diffY = mouseY.get() - dotY;
      const distance = Math.sqrt(diffX * diffX + diffY * diffY);
      
      const maxDist = 400;
      if (distance < maxDist) {
        const power = (maxDist - distance) / maxDist;
        // Magnetic pull effect
        x.set(diffX * power * 0.25);
        y.set(diffY * power * 0.25);
        scale.set(1 + power * 1.5);
        opacity.set(0.3 + power * 0.7);
      } else {
        x.set(0);
        y.set(0);
        scale.set(1);
        opacity.set(0.3);
      }
    };

    const unsubscribeX = mouseX.on("change", update);
    const unsubscribeY = mouseY.on("change", update);

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
        className="w-1 h-1 bg-purple-400/40 rounded-full"
      />
    </div>
  );
};

export default InteractiveGrid;