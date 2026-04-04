"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: 'Jan', price: 45000 },
  { date: 'Feb', price: 42000 },
  { date: 'Mar', price: 48000 },
  { date: 'Apr', price: 39000 },
  { date: 'May', price: 41000 },
  { date: 'Jun', price: 35000 },
  { date: 'Jul', price: 37000 },
];

const PriceHistory = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="glass p-8 rounded-[2.5rem] h-[400px] relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Price History</h3>
          <p className="text-gray-500 text-sm">Tracking trends over the last 6 months</p>
        </div>
        <div className="flex gap-2">
          {['1M', '3M', '6M', '1Y'].map((t) => (
            <button key={t} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${t === '6M' ? 'bg-gray-900 text-white' : 'bg-white/50 text-gray-600 hover:bg-white'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              hide 
              domain={['dataMin - 5000', 'dataMax + 5000']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#6366f1" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default PriceHistory;