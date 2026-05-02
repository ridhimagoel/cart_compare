"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Flame,
  Loader2,
  Search as SearchIcon,
  SlidersHorizontal,
  Sparkles,
  Store,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ProductItem } from "@/lib/productSearch";
import PurchaseRecorderForSearch from '../components/PurchaseRecorderForSearch';

type SearchMeta = {
  store?: string;
  provider?: string;
  source?: string;
  cached?: boolean;
  blocked?: boolean;
  effectiveQuery?: string;
  storeBreakdown?: Array<{ store: string; provider: string; count: number; blocked: boolean }>;
};

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProductItem[]>([]);
  const [exactResults, setExactResults] = useState<ProductItem[]>([]);
  const [relatedResults, setRelatedResults] = useState<ProductItem[]>([]);
  const [meta, setMeta] = useState<SearchMeta>({});
  const [activeStoreFilter, setActiveStoreFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<"smart" | "priceLow" | "priceHigh">("smart");

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
  const exactRatio = totalResults > 0 ? Math.round((exactResults.length / totalResults) * 100) : 0;
  const quickSearches = ["iphone 13", "iphone 14", "s24 ultra", "macbook air m3", "ps5", "running shoes"];

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setResults([]);
      setExactResults([]);
      setRelatedResults([]);
      setActiveStoreFilter("all");
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
          setMeta({
            store: data.store,
            provider: data.provider,
            source: data.source,
            cached: data.cached,
            blocked: data.blocked,
          });
          setError(data.message || "Unable to fetch live results right now.");
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
        setActiveStoreFilter("all");
        setMeta({
          store: data.store,
          provider: data.provider,
          source: data.source,
          cached: data.cached,
          blocked: data.blocked,
          effectiveQuery: data.effectiveQuery,
          storeBreakdown: data.storeBreakdown || [],
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
        setExactResults([]);
        setRelatedResults([]);
        setError("Network issue while fetching live results.");
      } finally {
        setIsLoading(false);
      }
    }, 900);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [trimmedQuery]);

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

  const displayedResults = useMemo(() => {
    const base = results.filter((item) => {
      if (activeStoreFilter === "all") return true;
      const storeKey = `${item.store || ""} ${item.source || ""}`.toLowerCase();
      return storeKey.includes(activeStoreFilter);
    });

    const sorted = [...base];
    if (sortMode === "priceLow") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortMode === "priceHigh") {
      sorted.sort((a, b) => b.price - a.price);
    } else {
      sorted.sort((a, b) => {
        const aExact = isExactLike(a, exactResults) ? 1 : 0;
        const bExact = isExactLike(b, exactResults) ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        return a.price - b.price;
      });
    }

    return sorted;
  }, [results, activeStoreFilter, sortMode, exactResults]);

  const renderItem = (item: ProductItem, index: number, type: "exact" | "related") => (
    <motion.a
      key={`${type}-${item.title}-${index}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      href={item.url || "#"}
      target={item.url ? "_blank" : undefined}
      rel={item.url ? "noopener noreferrer" : undefined}
      className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(139,92,246,0.22)] dark:border-white/10 dark:bg-white/5 ${
        item.url ? "" : "pointer-events-none opacity-80"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.12),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(6,182,212,0.08),_transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-100 dark:border-white/10 dark:bg-white/10">
          {item.image ? (
            <img src={item.image} alt={item.title} className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <span className="text-xs text-muted-foreground">No image</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${type === "exact" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {type === "exact" ? "Exact" : "Related"}
            </span>
            {item.store && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                <Store className="h-3.5 w-3.5" />
                {item.store}
              </span>
            )}
          </div>

          <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>

          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{item.priceText}</p>
              {(item.mrpText || item.discountPercent || item.offerText) && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  {item.mrpText && item.mrp && item.mrp > item.price && (
                    <span className="text-slate-400 line-through">{item.mrpText}</span>
                  )}
                  {item.discountPercent ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                      {item.discountPercent}% OFF
                    </span>
                  ) : null}
                </div>
              )}
              {item.offerText && (
                <p className="mt-1 line-clamp-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {item.offerText}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                <span>{item.rating || "Rating unavailable"}</span>
                {isUnavailableItem(item) && <span className="text-[10px] font-medium text-slate-400">Unavailable</span>}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">
              {isUnavailableItem(item) ? "Unavailable" : "Open"}
              <ExternalLink className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
      <PurchaseRecorderForSearch
        productName={item.title}
        price={item.price}
      />
    </motion.a>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#0b1430_0%,#121938_40%,#0f1732_100%)]">
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-violet-400/14 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-400/12 blur-3xl" />
      <div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-8 md:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          {meta.cached && <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">Cached</span>}
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/90 p-5 shadow-[0_20px_80px_rgba(2,6,23,0.35)] backdrop-blur-2xl dark:bg-white/5">
          <div className="smart-more-dots pointer-events-none absolute inset-0 opacity-25" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-500/8 via-transparent to-indigo-400/8" />

          <div className="relative mx-auto mb-1 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-violet-700 dark:bg-violet-400/15 dark:text-violet-200">
            <Sparkles className="h-3.5 w-3.5" /> Smart Discovery
          </div>
          <h1 className="relative text-center text-3xl font-black tracking-tight md:text-6xl">
            <span className="smart-more-gradient">Search Products</span>
          </h1>
          <p className="relative mt-2 text-center text-sm text-slate-500 dark:text-slate-300">Premium live search across stores with exact-first smart ranking.</p>

          <div className="mx-auto mt-5 grid max-w-6xl gap-3 lg:grid-cols-[1fr_auto]">
            <div className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 shadow-inner shadow-violet-500/5 transition-all duration-300 focus-within:border-violet-300 focus-within:neon-violet-ring dark:border-white/10 dark:bg-white/5">
              <SearchIcon className="h-5 w-5 text-violet-600" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try: iPhone 13, Samsung S24 Ultra, MacBook Air M3..."
                className="w-full border-none bg-transparent p-0 text-2xl font-bold text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-white md:text-3xl"
              />
            </div>

            <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              Source: Amazon + Flipkart + Myntra + AJIO
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
              <Flame className="h-3.5 w-3.5" />
              Trending
            </span>
            {quickSearches.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalResults}</p>
            </div>
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Exact</p>
              <p className="mt-1 text-2xl font-black text-cyan-800">{exactResults.length}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-700">Related</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-800">{relatedResults.length}</p>
            </div>
          </div>

          {totalResults > 0 && (
            <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50/80 px-3 py-2 dark:border-cyan-400/20 dark:bg-cyan-400/10">
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-cyan-800 dark:text-cyan-100">
                <span>Match Quality</span>
                <span>{exactRatio}% exact</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-cyan-100 dark:bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${exactRatio}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                />
              </div>
            </div>
          )}

          {meta.storeBreakdown && meta.storeBreakdown.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveStoreFilter("all")}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  activeStoreFilter === "all"
                    ? "border-violet-300 bg-violet-100 text-violet-800"
                    : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                }`}
              >
                All stores
              </button>
              {meta.storeBreakdown.map((entry) => (
                <button
                  onClick={() => setActiveStoreFilter(entry.provider.toLowerCase())}
                  key={`${entry.provider}-${entry.store}`}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    activeStoreFilter === entry.provider.toLowerCase()
                      ? "border-violet-300 bg-violet-100 text-violet-800"
                      : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  }`}
                >
                  {entry.store}: {entry.count}
                </button>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Sort
              </span>
              {[
                { key: "smart", label: "Smart" },
                { key: "priceLow", label: "Price: Low to High" },
                { key: "priceHigh", label: "Price: High to Low" },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSortMode(option.key as "smart" | "priceLow" | "priceHigh")}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    sortMode === option.key
                      ? "border-cyan-300 bg-cyan-100 text-cyan-800"
                      : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          {isLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
                <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                Fetching multi-store live results...
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex gap-4">
                      <div className="h-24 w-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
                      <div className="flex-1 space-y-3">
                        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                        <div className="h-6 w-28 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">Something went wrong</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && trimmedQuery.length >= 2 && (
            <div className="space-y-8">
              {displayedResults.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                    <TrendingUp className="h-4 w-4" />
                    All scraped results ({displayedResults.length})
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {displayedResults.map((item, index) => {
                      const isExact = isExactLike(item, exactResults);
                      return renderItem(item, index, isExact ? "exact" : "related");
                    })}
                  </div>
                </section>
              )}

              {displayedResults.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  No results for this filter. Try switching store or sort mode.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
