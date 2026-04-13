"use client";

import React from 'react';
import { Twitter, Instagram, Github, Linkedin, ArrowUpRight, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    Product: [
      { label: 'Price Tracker', href: '#live-comparisons' },
      { label: 'Price Alerts', href: '#how-it-works' },
      { label: 'Store Comparison', href: '#comparison-table' },
      { label: 'Browser Extension', href: '#extension' },
    ],
    Company: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Partners', href: '#' },
      { label: 'Contact', href: '#faq' },
    ],
    Resources: [
      { label: 'Help Center', href: '#faq' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Smart Shopping Tips', href: '#' },
      { label: 'Community', href: '#' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Security', href: '#' },
    ]
  };

  return (
    <footer className="relative pt-14 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_34%),linear-gradient(120deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] text-white shadow-[0_20px_70px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-purple-500/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative p-8 md:p-12 lg:p-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
              <div className="lg:col-span-5">
                <a href="/" className="text-3xl font-bold tracking-tighter flex items-center gap-3 mb-5">
                  <img src="/brand/compare-cart-mark.svg" alt="compare_cart logo" className="w-10 h-10" />
                  <span>compare_cart</span>
                </a>
                <p className="text-base md:text-lg text-slate-300 max-w-sm leading-relaxed mb-8">
                  Compare prices faster, track drops, and buy at the right time with practical shopping insights.
                </p>

                <div className="space-y-3 mb-7">
                  <div className="flex items-center gap-3 text-slate-300">
                    <Mail className="w-5 h-5 text-blue-300" />
                    <span>hello@comparecart.app</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <MapPin className="w-5 h-5 text-purple-300" />
                    <span>San Francisco, CA • Bangalore, IN</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {[Twitter, Instagram, Github, Linkedin].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="w-10 h-10 rounded-full border border-white/15 bg-white/5 text-slate-200 flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all duration-300"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-8">
                {Object.entries(footerLinks).map(([title, links]) => (
                  <div key={title}>
                    <h4 className="font-bold text-slate-200 mb-4 uppercase tracking-widest text-xs">{title}</h4>
                    <ul className="space-y-3">
                      {links.map((item) => (
                        <li key={item.label}>
                          <a href={item.href} className="text-slate-400 hover:text-white flex items-center gap-1 group transition-colors text-sm font-medium">
                            {item.label} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-7 border-t border-white/10 flex flex-col md:flex-row justify-between md:items-center gap-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <p className="text-slate-400 text-sm">© 2026 compare_cart Technologies</p>
                <div className="flex gap-6">
                  <a href="#" className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest">Status</a>
                  <a href="#" className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest">Privacy</a>
                  <a href="#" className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest">Terms</a>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;