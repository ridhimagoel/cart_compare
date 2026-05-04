"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Info } from 'lucide-react';

const ComparisonTable = () => {
  const features = [
    { name: "Real-time Price Tracking", compareCart: true, others: true },
    { name: "Historical Price Graphs", compareCart: true, others: false },
    { name: "AI Price Prediction", compareCart: true, others: false },
    { name: "Multi-store Comparison", compareCart: "50+ Stores", others: "5-10 Stores" },
    { name: "Browser Extension", compareCart: true, others: true },
    { name: "Verified Coupons", compareCart: true, others: false },
    { name: "Ad-free Experience", compareCart: true, others: false },
  ];

  return (
    <>
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold tracking-tighter mb-6">
            The <span className="text-gradient">compare_cart</span> Edge
          </h2>
          <p className="text-xl text-gray-600 dark:text-slate-300">How we stack up against the competition.</p>
        </div>

      <div className="glass rounded-[3rem] overflow-hidden border-none shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/10">
              <th className="p-8 text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-slate-300">Feature</th>
              <th className="p-8 text-center bg-purple-50/50 dark:bg-purple-500/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg rotate-12" />
                  <span className="font-bold text-gray-900 dark:text-white">compare_cart</span>
                </div>
              </th>
              <th className="p-8 text-center text-gray-400 dark:text-slate-300 font-medium">Others</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f, i) => (
              <motion.tr 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border-b border-gray-50 dark:border-white/10 last:border-none hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
              >
                <td className="p-8 font-medium text-gray-700 dark:text-slate-100 flex items-center gap-2">
                  {f.name} <Info className="w-4 h-4 text-gray-300 dark:text-slate-400 cursor-help" />
                </td>
                <td className="p-8 text-center bg-purple-50/30 dark:bg-purple-500/10">
                  {typeof f.compareCart === 'boolean' ? (
                    f.compareCart ? <Check className="w-6 h-6 text-purple-600 dark:text-purple-300 mx-auto" /> : <X className="w-6 h-6 text-gray-300 dark:text-slate-500 mx-auto" />
                  ) : (
                    <span className="font-bold text-purple-700 dark:text-purple-300">{f.compareCart}</span>
                  )}
                </td>
                <td className="p-8 text-center">
                  {typeof f.others === 'boolean' ? (
                    f.others ? <Check className="w-6 h-6 text-gray-500 dark:text-slate-300 mx-auto" /> : <X className="w-6 h-6 text-gray-300 dark:text-slate-500 mx-auto" />
                  ) : (
                    <span className="text-gray-500 dark:text-slate-300">{f.others}</span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
    </>
  );
};

export default ComparisonTable;