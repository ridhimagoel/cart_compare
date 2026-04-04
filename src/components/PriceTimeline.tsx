"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowDownRight, Tag, Zap } from 'lucide-react';

const timelineEvents = [
  {
    time: "Just Now",
    product: "MacBook Pro M3 Max",
    drop: "₹15,000",
    store: "Amazon",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-50"
  },
  {
    time: "12 mins ago",
    product: "Sony A7 IV Camera",
    drop: "₹8,400",
    store: "Flipkart",
    icon: ArrowDownRight,
    color: "text-green-500",
    bg: "bg-green-50"
  },
  {
    time: "45 mins ago",
    product: "Nike Pegasus 40",
    drop: "₹2,200",
    store: "Myntra",
    icon: Tag,
    color: "text-blue-500",
    bg: "bg-blue-50"
  },
  {
    time: "2 hours ago",
    product: "Samsung Odyssey G9",
    drop: "₹12,000",
    store: "Reliance",
    icon: ArrowDownRight,
    color: "text-purple-500",
    bg: "bg-purple-50"
  }
];

const PriceTimeline = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold tracking-tighter mb-4">
            Price <span className="text-gradient">Pulse</span>
          </h2>
          <p className="text-lg text-gray-600">
            A real-time stream of the most significant price drops across the web.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

          <div className="space-y-12">
            {timelineEvents.map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative pl-20 group"
              >
                {/* Timeline Dot */}
                <div className={`absolute left-4 top-0 w-8 h-8 rounded-full ${event.bg} border-4 border-white shadow-sm flex items-center justify-center z-10 group-hover:scale-125 transition-transform duration-500`}>
                  <event.icon className={`w-4 h-4 ${event.color}`} />
                </div>

                <div className="glass p-8 rounded-[2.5rem] hover:bg-white/60 transition-all duration-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        <Clock className="w-3 h-3" /> {event.time}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{event.product}</h3>
                      <p className="text-gray-500">Available at <span className="font-bold text-gray-700">{event.store}</span></p>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-black ${event.color} tracking-tighter`}>
                        -{event.drop}
                      </div>
                      <button className="mt-2 text-sm font-bold text-gray-900 hover:underline">
                        View Deal →
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PriceTimeline;