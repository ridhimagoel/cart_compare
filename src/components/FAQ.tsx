"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How does compare_cart track prices?",
    a: "We scan supported stores regularly and refresh product prices throughout the day. You see a single comparison view with updated prices, coupons, and key buying details."
  },
  {
    q: "Is the browser extension safe to use?",
    a: "Yes. The extension runs only on supported shopping pages and does not track unrelated browsing activity. You stay in control of your alerts and saved products."
  },
  {
    q: "Can I track prices on international stores?",
    a: "We currently focus on major stores and keep adding support based on demand. If a store you use is missing, you can request it and we'll prioritize it."
  },
  {
    q: "How accurate are the price predictions?",
    a: "Predictions are based on past price patterns, seasonality, and current trend signals. They are guidance, not guarantees, so you can make better timing decisions."
  },
  {
    q: "Is compare_cart free to use?",
    a: "Yes. Core features like comparison, tracking, and alerts are free to use. Any future premium features will remain optional."
  }
];

const FAQ = () => {
  return (
    <section id="faq" className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold tracking-tighter mb-4">
            Common <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-lg text-gray-600">
            Quick answers before you start saving.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <AccordionItem value={`item-${i}`} className="glass px-8 rounded-3xl border-none">
                <AccordionTrigger className="text-left font-bold text-lg py-6 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-lg pb-6 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;