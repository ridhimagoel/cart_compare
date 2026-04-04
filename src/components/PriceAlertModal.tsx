"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Mail, Smartphone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PriceAlertModal = ({ isOpen, onClose }: PriceAlertModalProps) => {
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg glass rounded-[3rem] p-10 shadow-2xl overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-8">
                    <Bell className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter mb-4">Set Price Alert</h2>
                  <p className="text-gray-600 mb-8">
                    We'll notify you the moment the price for <span className="font-bold text-gray-900">iPhone 15 Pro</span> drops below your target.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold uppercase tracking-widest text-gray-400">Target Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xl">₹</span>
                        <Input 
                          type="number" 
                          placeholder="1,30,000" 
                          className="pl-10 h-14 rounded-2xl text-lg font-bold border-gray-200 focus:border-purple-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold uppercase tracking-widest text-gray-400">Notification Method</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button type="button" className="flex items-center justify-center gap-2 h-14 rounded-2xl border-2 border-purple-600 bg-purple-50 text-purple-600 font-bold">
                          <Mail className="w-5 h-5" /> Email
                        </button>
                        <button type="button" className="flex items-center justify-center gap-2 h-14 rounded-2xl border-2 border-gray-100 hover:border-gray-200 font-bold text-gray-600">
                          <Smartphone className="w-5 h-5" /> Push
                        </button>
                      </div>
                    </div>

                    <Button className="w-full h-14 rounded-2xl bg-gray-900 text-white text-lg font-bold hover:bg-gray-800 transition-all">
                      Create Alert
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 mx-auto mb-8">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter mb-4">Alert Set!</h2>
                  <p className="text-gray-600">
                    You're all set. We'll keep an eye on the prices for you.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PriceAlertModal;