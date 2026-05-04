"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Bell, ArrowRight, TrendingDown } from 'lucide-react';

type WatchItem = {
  id: number;
  title: string;
  url?: string | null;
  store?: string | null;
  created_at?: string;
  target_price?: number | null;
  alerted?: number | null;
};

const WatchlistPreview: React.FC = () => {
  const [items, setItems] = React.useState<WatchItem[]>([]);
  const [emailMap, setEmailMap] = React.useState<Record<string, string>>({});
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sortMode, setSortMode] = React.useState<'newest' | 'oldest' | 'priceLow' | 'priceHigh'>('newest');

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/db/watchlist');
        const json = await res.json();
        if (mounted && json?.ok) setItems(json.items || []);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    // listen for external additions
    function onAdd() { load(); }
    window.addEventListener('watchlist:added', onAdd as EventListener);
    return () => { mounted = false; window.removeEventListener('watchlist:added', onAdd as EventListener); };
  }, []);

  React.useEffect(() => {
    // load saved emails from localStorage
    const map: Record<string, string> = {};
    try {
      for (const it of items) {
        const key = `watchlist-email-${it.id}`;
        const v = localStorage.getItem(key);
        if (v) map[String(it.id)] = v;
      }
    } catch (e) {}
    setEmailMap(map);
  }, [items]);

  React.useEffect(() => {
    let mounted = true;
    async function loadAlerts() {
      try {
        const res = await fetch('/api/db/alerts');
        const json = await res.json();
        if (mounted && json?.ok) setAlerts(json.items || []);
      } catch (e) {}
    }
    loadAlerts();
    const t = setInterval(loadAlerts, 30000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  async function ack(id: number) {
    try {
      await fetch('/api/db/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      const res = await fetch('/api/db/watchlist');
      const json = await res.json();
      if (json?.ok) setItems(json.items || []);
    } catch (e) {}
  }

  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 text-pink-600 text-xs font-bold uppercase tracking-widest mb-8">
              <Heart className="w-4 h-4 fill-current" /> Your Workspace
            </div>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-8">
              Your personal <span className="text-gradient">deal hunter.</span>
            </h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Save products to your watchlist and let compare_cart do the hard work. We track prices and notify you when your target is hit.
            </p>

            <div className="space-y-6 mb-12">
              <div className="flex gap-4 items-center p-4 rounded-2xl bg-white shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="font-medium text-gray-700">Instant notifications on price drops</p>
              </div>
              <div className="flex gap-4 items-center p-4 rounded-2xl bg-white shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <p className="font-medium text-gray-700">Historical data for every saved item</p>
              </div>
            </div>

            <button className="flex items-center gap-2 font-bold text-gray-900 hover:gap-4 transition-all">
              Explore Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 blur-3xl rounded-full" />
            <div className="relative space-y-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">Saved items: <strong>{items.length}</strong></div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Sort</label>
                  <select value={sortMode} onChange={(e) => setSortMode(e.target.value as any)} className="rounded-md px-2 py-1 bg-white/5 text-white">
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="priceLow">Price: Low → High</option>
                    <option value="priceHigh">Price: High → Low</option>
                  </select>
                </div>
              </div>
              {loading && <div className="text-gray-500">Loading watchlist...</div>}
              {!loading && items.length === 0 && (
                <div className="p-6 rounded-2xl bg-white/60 border border-gray-100">No items in your watchlist yet.</div>
              )}
              {(() => {
                const list = [...items];
                list.sort((a, b) => {
                  if (sortMode === 'newest') {
                    return (new Date(b.created_at || 0).getTime() || 0) - (new Date(a.created_at || 0).getTime() || 0);
                  }
                  if (sortMode === 'oldest') {
                    return (new Date(a.created_at || 0).getTime() || 0) - (new Date(b.created_at || 0).getTime() || 0);
                  }
                  const aPrice = Number((a as any).avg_price ?? (a.target_price ?? 0) ?? 0);
                  const bPrice = Number((b as any).avg_price ?? (b.target_price ?? 0) ?? 0);
                  if (sortMode === 'priceLow') return aPrice - bPrice;
                  if (sortMode === 'priceHigh') return bPrice - aPrice;
                  return 0;
                });
                return list.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="glass p-6 rounded-3xl flex items-center gap-6 group hover:bg-white/80 transition-all"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400">
                    <span className="text-sm">IMG</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-medium text-purple-600">Target: {item.target_price ? `₹${item.target_price}` : '—'}</span>
                      <span className="text-xs text-gray-400">Saved: {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</span>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs text-gray-500 block mb-1">Never miss a drop alert — email</label>
                      <div className="flex gap-2">
                        <input
                          value={emailMap[String(item.id)] || ''}
                          onChange={(e) => setEmailMap((m) => ({ ...m, [String(item.id)]: e.target.value }))}
                          placeholder="you@example.com"
                          className="flex-1 rounded-lg px-3 py-2 bg-white/5 text-white outline-none"
                        />
                        <button
                          onClick={() => {
                            try { localStorage.setItem(`watchlist-email-${item.id}`, emailMap[String(item.id)] || ''); } catch (e) {}
                          }}
                          className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.alerted ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                    {item.alerted ? 'Price Drop!' : 'Tracking'}
                  </div>
                </motion.div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WatchlistPreview;
