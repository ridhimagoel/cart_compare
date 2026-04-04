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
    q: "How does Vantage track prices?",
    a: "Our proprietary AI engine scans over 50 major retailers every few minutes. We use advanced web scraping and API integrations to ensure you get the most accurate, real-time pricing data available."
  },
  {
    q: "Is the browser extension safe to use?",
    a: "Absolutely. We take privacy seriously. Our extension only activates on supported shopping sites and never collects personal data or browsing history outside of product pages."
  },
  {
    q: "Can I track prices on international stores?",
    a: "Currently, we support major retailers in India, USA, and UK. We are constantly adding new regions and stores to our network."
  },
  {
    q: "How accurate are the price predictions?",
    a: "Our AI models analyze years of historical data, seasonal trends, and upcoming sale events. While not 100% guaranteed, our predictions have an 85% accuracy rate in forecasting major price drops."
  },
  {
    q: "Is Vantage free to use?",
    a: "Yes! Our core features, including price tracking, alerts, and the browser extension, are completely free for all users. We may introduce premium features for power shoppers in the future."
  }
];

const FAQ = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold tracking-tighter mb-4">
            Common <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about the ultimate shopping companion.
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