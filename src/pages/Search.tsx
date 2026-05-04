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
import AddToWishlistButton from '@/components/AddToWishlistButton';
import WatchlistPreview from '@/components/WatchlistPreview';

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
  const FALLBACK_SAMPLE: ProductItem[] = [
    {
      title: "Apple iPhone 15 (128GB) - Fallback sample",
      price: 74900,
      priceText: "₹74,900",
      mrp: null,
      mrpText: null,
      discountPercent: null,
      savingsAmount: null,
      savingsText: null,
      couponText: null,
      dealType: null,
      offerText: null,
      hasOffer: false,
      rating: null,
      image: null,
      url: null,
      store: "Amazon India",
      source: "amazon",
    } as ProductItem,
    {
      title: "Apple iPhone 15 Pro (256GB) - Fallback sample",
      price: 129900,
      priceText: "₹1,29,900",
      mrp: null,
      mrpText: null,
      discountPercent: null,
      savingsAmount: null,
      savingsText: null,
      couponText: null,
      dealType: null,
      offerText: null,
      hasOffer: false,
      rating: null,
      image: null,
      url: null,
      store: "Flipkart",
      source: "flipkart",
    } as ProductItem,
  ];
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProductItem[]>([]);
  const [exactResults, setExactResults] = useState<ProductItem[]>([]);
  const [relatedResults, setRelatedResults] = useState<ProductItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [exactCount, setExactCount] = useState<number>(0);
  const [relatedCount, setRelatedCount] = useState<number>(0);
  const [meta, setMeta] = useState<SearchMeta>({});
  const [activeStoreFilter, setActiveStoreFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<"smart" | "priceLow" | "priceHigh">("smart");
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [lastFetchUrl, setLastFetchUrl] = useState<string | null>(null);
  const [lastFetchError, setLastFetchError] = useState<string | null>(null);

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

  // local UI state for Watchlist modal
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Persist fetched results to the API DB when enabled via Vite env `VITE_PERSIST_RESULTS`.
  // This is best-effort and will not block the UI; failures are logged silently.
  const persistResultsToServer = async (searchQuery: string, items: ProductItem[], extraMeta: any) => {
    try {
      if (typeof window === 'undefined') return;
      if (import.meta.env.VITE_PERSIST_RESULTS == 'true') return;
      if (!searchQuery || !items || !items.length) return;

      const apiBase = `${window.location.protocol}//${window.location.hostname}:4000`;

      // Create or update search_history
      const historyResp = await fetch(`${apiBase}/search-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, results_count: items.length, metadata: extraMeta }),
      });
      const historyJson = await historyResp.json();
      if (!historyResp.ok || !historyJson.ok || !historyJson.id) return;
      const search_history_id = historyJson.id;

      // Prepare minimal result objects for insertion
      const toInsert = items.map((it) => ({
        title: it.title || null,
        price: it.price != null ? Number(it.price) : null,
        store: it.store || null,
        url: it.url || null,
        metadata: { image: it.image || null, rating: it.rating || null, priceText: it.priceText || null },
      }));

      // Batch insert
      await fetch(`${apiBase}/search-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search_history_id, results: toInsert }),
      });
    } catch (e) {
      // Best-effort: don't break UX if persistence fails
      // eslint-disable-next-line no-console
      console.warn('Persisting search results failed', e && e.message ? e.message : e);
    }
  };

  const exactRatio = totalResults > 0 ? Math.round((exactResults.length / totalResults) * 100) : 0;
  const quickSearches = ["iphone 13", "iphone 14", "s24 ultra", "macbook air m3", "ps5", "running shoes"];

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setResults([]);
      setExactResults([]);
      setRelatedResults([]);
      setTotalCount(0);
      setExactCount(0);
      setRelatedCount(0);
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
        setLastFetchError(null);

        let res: Response | null = null;
        // Query all stores by default
        const sameOriginUrl = `/api/scrape/compare?q=${encodeURIComponent(trimmedQuery)}&limit=24`;
        setLastFetchUrl(sameOriginUrl);
        try {
          res = await fetch(sameOriginUrl, { signal: controller.signal });
        } catch (err: any) {
          // network error to same-origin; will try fallback to explicit scraper port
          res = null;
        }

        if (!res || !res.ok) {
          const apiBase = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:8080` : "http://localhost:8080";
          const fallbackUrl = `${apiBase}/api/scrape/compare?q=${encodeURIComponent(trimmedQuery)}&limit=24`;
          setLastFetchUrl(fallbackUrl);
          try {
            res = await fetch(fallbackUrl);
            console.warn("Fell back to explicit scraper at :8080");
          } catch (err: any) {
            setLastFetchError(err?.message || String(err));
            // both attempts failed
            throw err;
          }
        }

        const data = await res.json();
        setRawResponse(data);

        if (!res.ok || !data.ok) {
          // If live scraping failed but we have no results, show a small fallback
          const hasAnyItems = Array.isArray(data?.allScrapedItems) && data.allScrapedItems.length > 0 || Array.isArray(data?.items) && data.items.length > 0;
          if (!hasAnyItems) {
            setResults(FALLBACK_SAMPLE);
            setExactResults([]);
            setRelatedResults([]);
            setTotalCount(FALLBACK_SAMPLE.length);
            setExactCount(0);
            setRelatedCount(0);
            setMeta({
              store: data.store || "fallback",
              provider: data.provider || "fallback",
              source: data.source || "fallback",
              cached: true,
              blocked: data.blocked,
              effectiveQuery: data.effectiveQuery,
              storeBreakdown: data.storeBreakdown || [],
            });
            setError("Live scraping failed — showing fallback sample results. Retry for live data.");
            return;
          }

          setResults([]);
          setExactResults([]);
          setRelatedResults([]);
          setTotalCount(data.allScrapedCount || 0);
          setExactCount(data.exactCount || 0);
          setRelatedCount(data.relatedCount || 0);
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

          const aMatch = tokenMatchCount(a.title);
          const bMatch = tokenMatchCount(b.title);
          if (aMatch !== bMatch) return bMatch - aMatch;

          const aAccessory = queryLooksLikeDevice && isAccessoryLikeTitle(a.title) ? 1 : 0;
          const bAccessory = queryLooksLikeDevice && isAccessoryLikeTitle(b.title) ? 1 : 0;
          if (aAccessory !== bAccessory) return aAccessory - bAccessory;
          return a.price - b.price;
        });
        setExactResults(exactItems);
        setRelatedResults(relatedItems);
        setResults(merged);
        setTotalCount(data.allScrapedCount || merged.length);
        setExactCount(data.exactCount || exactItems.length);
        setRelatedCount(data.relatedCount || relatedItems.length);
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
        // Fire-and-forget persist to the API DB (if enabled)
        void persistResultsToServer(trimmedQuery, merged, { provider: data.provider, effectiveQuery: data.effectiveQuery, storeBreakdown: data.storeBreakdown || [] });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
        setExactResults([]);
        setRelatedResults([]);
        setTotalCount(0);
        setExactCount(0);
        setRelatedCount(0);
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

    const tokenMatchCount = (title: string) => {
      if (!normalizedQuery) return 0;
      const t = title.toLowerCase();
      const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
      let count = 0;
      for (const tok of tokens) if (t.includes(tok)) count++;
      return count;
    };

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

        const aMatch = tokenMatchCount(a.title);
        const bMatch = tokenMatchCount(b.title);
        if (aMatch !== bMatch) return bMatch - aMatch;

        const aAccessory = queryLooksLikeDevice && isAccessoryLikeTitle(a.title) ? 1 : 0;
        const bAccessory = queryLooksLikeDevice && isAccessoryLikeTitle(b.title) ? 1 : 0;
        if (aAccessory !== bAccessory) return aAccessory - bAccessory;

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
      className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(139,92,246,0.22)] dark:border-white/10 dark:bg-white/5 ${
        item.url ? "" : "pointer-events-none opacity-80"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,41,0.12),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(6,182,212,0.08),_transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-100 dark:border-white/10 dark:bg-white/10">
          {item.image ? (
            <img src={item.image} alt={item.title} className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <span className="text-xs text-muted-foreground">No image</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
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

            <div className="ml-3 flex-shrink-0">
              <AddToWishlistButton title={item.title} url={item.url} store={item.store} className="px-3 py-1 rounded-full text-sm" />
            </div>
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
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">{item.discountPercent}% OFF</span>
                  ) : null}
                </div>
              )}
              {item.offerText && (
                <p className="mt-1 line-clamp-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">{item.offerText}</p>
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

        <div className="mt-3 flex justify-end">
          {/* AddToWishlistButton handles saved state and persistence */}
          <AddToWishlistButton title={item.title} url={item.url} store={item.store} />
        </div>

        <PurchaseRecorderForSearch productName={item.title} price={item.price} />
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
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try: iPhone 13, Samsung S24 Ultra, MacBook Air M3..." className="w-full border-none bg-transparent p-0 text-2xl font-bold text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-white md:text-3xl" />
            </div>

            <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">Source: Amazon + Flipkart + Myntra + AJIO</div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
              <Flame className="h-3.5 w-3.5" />
              Trending
            </span>
            {quickSearches.map((suggestion) => (
              <button key={suggestion} onClick={() => setQuery(suggestion)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                {suggestion}
              </button>
            ))}
          </div>

          {/* Totals and Match Quality removed per user request */}

          {meta.storeBreakdown && meta.storeBreakdown.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setActiveStoreFilter("all")} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                activeStoreFilter === "all" ? "border-violet-300 bg-violet-100 text-violet-800" : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              }`}>
                All stores
              </button>
              {meta.storeBreakdown.map((entry) => (
                <button onClick={() => setActiveStoreFilter(entry.provider.toLowerCase())} key={`${entry.provider}-${entry.store}`} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  activeStoreFilter === entry.provider.toLowerCase() ? "border-violet-300 bg-violet-100 text-violet-800" : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                }`}>
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
              {[{ key: "smart", label: "Smart" }, { key: "priceLow", label: "Price: Low to High" }, { key: "priceHigh", label: "Price: High to Low" }].map((option) => (
                <button key={option.key} onClick={() => setSortMode(option.key as "smart" | "priceLow" | "priceHigh")} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  sortMode === option.key ? "border-cyan-300 bg-cyan-100 text-cyan-800" : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                }`}>
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
                        All scraped results ({results.length})
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
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">No results for this filter. Try switching store or sort mode.</div>
              )}
            </div>
          )}
        </div>
        {/* Debug panel removed */}

        {/* View Wishlist floating button */}
        <div className="fixed right-6 top-28 z-50">
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-95"
          >
            View Wishlist
          </button>
        </div>

        {isWishlistOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsWishlistOpen(false)} />
            <div className="relative z-10 w-full max-w-3xl p-6">
              <div className="rounded-xl bg-white/5 p-4 shadow-2xl backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Your Wishlist</h3>
                  <button onClick={() => setIsWishlistOpen(false)} className="text-sm font-medium text-slate-500">Close</button>
                </div>
                <WatchlistPreview />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
