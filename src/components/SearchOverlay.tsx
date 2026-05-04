"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  ExternalLink,
  Loader2,
  Search,
  Sparkles,
  Store,
  TrendingUp,
  X,
} from "lucide-react";
import type { ProductItem } from "@/lib/productSearch";
import AddToWishlistButton from '@/components/AddToWishlistButton';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchMeta = {
  store?: string;
  provider?: string;
  source?: string;
  cached?: boolean;
  blocked?: boolean;
  effectiveQuery?: string;
  endpoint?: string;
  storeBreakdown?: Array<{ store: string; provider: string; count: number; blocked: boolean }>;
};

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProductItem[]>([]);
  const [exactResults, setExactResults] = useState<ProductItem[]>([]);
  const [relatedResults, setRelatedResults] = useState<ProductItem[]>([]);
  const [meta, setMeta] = useState<SearchMeta>({});

  const recentSearches = ["iPhone 15 Pro", "Sony WH-1000XM5", "MacBook Air M3", "Nike Air Max"];
  const trending = ["PS5 Slim", "Samsung S24 Ultra", "Dyson Airwrap", "Kindle Paperwhite"];

  const trimmedQuery = useMemo(() => query.trim(), [query]);
  const normalizedQuery = useMemo(
    () => trimmedQuery.toLowerCase().replace(/\s+/g, " ").trim(),
    [trimmedQuery]
  );
  const queryLooksLikeDevice = useMemo(
    () => /\b(phone|iphone|samsung|pixel|oneplus|mobile|laptop|macbook|tablet|watch|tv)\b/i.test(trimmedQuery),
    [trimmedQuery]
  );
  const totalResults = results.length;
  const sourceLabel = "Amazon • Flipkart • Myntra • AJIO";

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setExactResults([]);
      setRelatedResults([]);
      setError(null);
      setMeta({});
      setIsLoading(false);
      return;
    }

    if (trimmedQuery.length < 2) {
      setResults([]);
      setExactResults([]);
      setRelatedResults([]);
      setError(null);
      setMeta({});
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/scrape/compare?q=${encodeURIComponent(trimmedQuery)}&limit=24&stores=amazon,flipkart,myntra,ajio`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setResults([]);
          setExactResults([]);
          setRelatedResults([]);
          setMeta({ store: data.store, provider: data.provider, source: data.source, cached: data.cached, blocked: data.blocked });
          setError(data.message || 'Unable to fetch live results right now.');
          return;
        }

        const exactItems: ProductItem[] = data.exactItems || [];
        const relatedItems: ProductItem[] = data.relatedItems || [];
        const rankedItems: ProductItem[] = data.rankedItems || [];
        const allItems: ProductItem[] = data.allScrapedItems || data.items || [];
        const orderedPool: ProductItem[] = [...exactItems, ...relatedItems, ...rankedItems, ...allItems];
        const mergedBase: ProductItem[] = orderedPool.filter((item, index, arr) => {
          const key = item.url || `${item.title}:${item.price}:${item.store || ""}:${item.source || ""}`;
          return (
            arr.findIndex((candidate) => {
              const candidateKey = candidate.url || `${candidate.title}:${candidate.price}:${candidate.store || ""}:${candidate.source || ""}`;
              return candidateKey === key;
            }) === index
          );
        });
        const merged: ProductItem[] = [...mergedBase].sort((a, b) => {
          const aExact = isExactLike(a, exactItems) ? 1 : 0;
          const bExact = isExactLike(b, exactItems) ? 1 : 0;
          if (aExact !== bExact) return bExact - aExact;
          const aAccessory = queryLooksLikeDevice && isAccessoryLikeTitle(a.title) ? 1 : 0;
          const bAccessory = queryLooksLikeDevice && isAccessoryLikeTitle(b.title) ? 1 : 0;
          if (aAccessory !== bAccessory) return aAccessory - bAccessory;
          return a.price - b.price;
        });

        setExactResults(exactItems);
        setRelatedResults(relatedItems);
        setResults(merged);
        setMeta({
          store: data.store,
          provider: data.provider,
          source: data.source,
          cached: data.cached,
          blocked: data.blocked,
          effectiveQuery: data.effectiveQuery,
          endpoint: data.endpoint,
          storeBreakdown: data.storeBreakdown || [],
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setResults([]);
        setExactResults([]);
        setRelatedResults([]);
        setError('Network issue while fetching live results.');
      } finally {
        setIsLoading(false);
      }
    }, 900);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [isOpen, trimmedQuery]);

  const isUnavailableItem = (item: ProductItem) => {
    const text = `${item.title} ${item.rating || ""}`.toLowerCase();
    return !item.url || /not available|currently unavailable|coming soon|out of stock/.test(text);
  };

  const isAccessoryLikeTitle = (title: string) =>
    /\b(case|cover|tempered|protector|screen guard|screen protector|glass|charger|cable|adapter|skin|back cover|camera lens|magsafe|wallet|stand|holder|bumper)\b/i.test(
      title
    ) || /\b(compatible with|designed for|fit for|fits|works with)\b/i.test(title);

  const isExactLike = (item: ProductItem, exactItems: ProductItem[]) => {
    const inExact = exactItems.some((exact) => (exact.url || exact.title) === (item.url || item.title));
    if (inExact) return true;
    if (!normalizedQuery) return false;
    const normalizedTitle = item.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (!normalizedTitle.includes(normalizedQuery)) return false;
    if (queryLooksLikeDevice && isAccessoryLikeTitle(normalizedTitle)) return false;
    return true;
  };

  const renderProductCard = (item: ProductItem, index: number, variant: "exact" | "related") => (
    <motion.a
      key={`${variant}-${item.title}-${index}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      href={item.url || "#"}
      target={item.url ? "_blank" : undefined}
      rel={item.url ? "noopener noreferrer" : undefined}
      className={`group rounded-[1.75rem] border bg-white/80 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(124,58,237,0.18)] dark:bg-white/8 ${
        variant === "exact"
          ? "border-emerald-200/80 dark:border-emerald-400/25"
          : "border-white/40 dark:border-white/10"
      } ${item.url ? "" : "pointer-events-none opacity-80"}`}
    >
      <div className="flex gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
          {item.image ? (
            <img src={item.image} alt={item.title} className="h-full w-full object-contain p-2" />
          ) : (
            <div className="text-center text-xs font-medium text-muted-foreground">No image</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                variant === "exact"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200"
              }`}
            >
              {variant === "exact" ? "Best match" : "Related"}
            </span>
            {item.store && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                <Store className="h-3.5 w-3.5" />
                {item.store}
              </span>
            )}
            {item.source && (
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-400/15 dark:text-violet-200">
                {item.source}
              </span>
            )}
          </div>

          <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 dark:text-white">{item.title}</p>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{item.priceText}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                <span>{item.rating || "Rating unavailable"}</span>
                {isUnavailableItem(item) && <span className="text-[10px] font-medium text-slate-400">Unavailable</span>}
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 transition-transform group-hover:translate-x-0.5 dark:text-violet-300">
              {isUnavailableItem(item) ? "Unavailable" : "View deal"}
              <ExternalLink className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </motion.a>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(180deg,_rgba(2,6,23,0.92),_rgba(15,23,42,0.92))] text-slate-900 backdrop-blur-3xl dark:text-white"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col px-5 pb-16 pt-6 md:px-8 md:pt-8">
            <div className="rounded-[2rem] border border-white/15 bg-white/85 p-5 shadow-[0_20px_80px_rgba(2,6,23,0.18)] backdrop-blur-2xl dark:bg-slate-950/70">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-1 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/30">
                    <Sparkles className="h-7 w-7" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
                      <span>Buy Hatke style search</span>
                      {meta.cached && <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] text-sky-700 dark:bg-sky-400/15 dark:text-sky-200">Cached</span>}
                    </div>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-300 md:text-base">
                      Search products with a cleaner, premium shopping view.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-end">
                <div className="flex-1 rounded-[1.75rem] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <Search className="h-6 w-6 text-violet-600 dark:text-violet-300" />
                    <input
                      autoFocus
                      placeholder="Search phones, earbuds, laptops, shoes..."
                      className="w-full border-none bg-transparent p-0 text-3xl font-black tracking-tight text-slate-950 placeholder:text-slate-400 focus:ring-0 dark:text-white md:text-5xl"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center rounded-[1.5rem] border border-slate-200/80 bg-white/90 px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  Source: Amazon + Flipkart + Myntra + AJIO
                </div>
              </div>

              {trimmedQuery.length >= 2 && (
                <div className="mt-6 space-y-6">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950 px-4 py-4 text-white shadow-lg shadow-slate-950/20">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Total results</p>
                      <p className="mt-2 text-3xl font-black">{totalResults}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-200">Exact matches</p>
                      <p className="mt-2 text-3xl font-black text-emerald-800 dark:text-emerald-100">{exactResults.length}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm dark:border-amber-400/20 dark:bg-amber-400/10">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-amber-700 dark:text-amber-100">Related picks</p>
                      <p className="mt-2 text-3xl font-black text-amber-800 dark:text-amber-100">{relatedResults.length}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 px-4 py-4 shadow-sm dark:border-sky-400/20 dark:bg-sky-400/10">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-sky-700 dark:text-sky-100">Source</p>
                      <p className="mt-2 text-xl font-black text-sky-800 dark:text-sky-100">{sourceLabel}</p>
                    </div>
                  </div>

                  {meta.storeBreakdown && meta.storeBreakdown.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {meta.storeBreakdown.map((entry) => (
                        <span
                          key={`${entry.provider}-${entry.store}`}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                        >
                          {entry.store}: {entry.count}
                        </span>
                      ))}
                    </div>
                  )}

                  {meta.effectiveQuery && meta.effectiveQuery !== trimmedQuery && (
                    <div className="rounded-[1.5rem] border border-violet-200 bg-violet-50 px-4 py-4 text-sm text-violet-900 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-50">
                      Search optimized as: <span className="font-semibold">{meta.effectiveQuery}</span>
                    </div>
                  )}

                  {isLoading && (
                    <div className="flex items-center gap-3 rounded-[1.5rem] border border-white/15 bg-white/85 px-5 py-4 text-slate-700 shadow-sm dark:bg-white/10 dark:text-white">
                      <Loader2 className="h-5 w-5 animate-spin text-violet-600 dark:text-violet-300" />
                      Fetching live prices across stores...
                    </div>
                  )}

                  {!isLoading && error && (
                    <div className="flex items-start gap-3 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-50">
                      <AlertCircle className="mt-0.5 h-5 w-5" />
                      <div>
                        <p className="font-semibold">Could not fetch live results</p>
                        <p className="mt-1 text-sm text-rose-700 dark:text-rose-100">{error}</p>
                      </div>
                    </div>
                  )}

                  {!isLoading && !error && results.length > 0 && (
                    <div className="space-y-8">
                      {results.length > 0 && (
                        <section>
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                              <TrendingUp className="h-4 w-4" />
                              All scraped results
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-300">
                              Showing complete scraped list from all stores
                            </div>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {results.map((item, index) => {
                              const isExact = isExactLike(item, exactResults);
                              return renderProductCard(item, index, isExact ? "exact" : "related");
                            })}
                          </div>
                        </section>
                      )}
                    </div>
                  )}

                  {!isLoading && !error && trimmedQuery.length >= 2 && results.length === 0 && (
                    <div className="rounded-[1.5rem] border border-white/15 bg-white/85 px-5 py-6 text-slate-600 shadow-sm dark:bg-white/10 dark:text-slate-200">
                      <p className="font-semibold text-slate-900 dark:text-white">No strong matches yet.</p>
                      <p className="mt-1 text-sm">Try a broader keyword for a wider result set.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-[1.75rem] border border-white/15 bg-white/85 p-6 shadow-sm dark:bg-white/8"
              >
                <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                  <Clock className="h-4 w-4" /> Recent searches
                </div>
                <div className="space-y-3">
                  {recentSearches.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(item)}
                      className="group flex w-full items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-left text-lg font-semibold text-slate-900 transition-colors hover:border-violet-200 hover:bg-violet-50 dark:text-white dark:hover:border-violet-400/20 dark:hover:bg-white/8"
                    >
                      <span>{item}</span>
                      <ArrowRight className="h-5 w-5 opacity-0 transition-all group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-[1.75rem] border border-white/15 bg-white/85 p-6 shadow-sm dark:bg-white/8"
              >
                <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                  <TrendingUp className="h-4 w-4" /> Trending now
                </div>
                <div className="flex flex-wrap gap-3">
                  {trending.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(item)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-violet-200"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <AddToWishlistButton title={item.title} url={item.url} store={item.store} className="px-3 py-1 rounded-md" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;