import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { dedupeProducts, rankProducts, type ProductItem } from "./src/lib/productSearch";

const scrapeCache = new Map<string, { expiresAt: number; data: unknown }>();
const inflightScrapeCache = new Map<string, Promise<unknown>>();

type AmazonScrapedItem = {
  title: string;
  price: number;
  priceText: string | null;
  rating: string | null;
  image: string | null;
  url: string | null;
};

type StoreKey = "amazon" | "flipkart" | "myntra" | "ajio";

type StoreScrapeResult = {
  ok: boolean;
  blocked?: boolean;
  store: string;
  provider: StoreKey;
  source: StoreKey;
  query: string;
  count: number;
  items: ProductItem[];
  message?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function normalizeAmazonProductUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl, "https://www.amazon.in");
    const asinMatch = url.pathname.match(/\/(dp|gp\/product)\/([A-Z0-9]{8,})/i);
    if (asinMatch?.[2]) {
      return `https://www.amazon.in/dp/${asinMatch[2].toUpperCase()}`;
    }
    url.search = "";
    return url.href;
  } catch {
    return rawUrl;
  }
}

function normalizeFlipkartProductUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl, "https://www.flipkart.com");
    const preservedParams = ["pid", "lid", "marketplace", "store", "srno", "otracker", "iid"];
    const nextSearch = new URLSearchParams();
    for (const key of preservedParams) {
      const value = url.searchParams.get(key);
      if (value) nextSearch.set(key, value);
    }
    url.search = nextSearch.toString();
    return url.href;
  } catch {
    return rawUrl;
  }
}

function normalizeMyntraProductUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl, "https://www.myntra.com");
    url.search = "";
    return url.href;
  } catch {
    return rawUrl;
  }
}

function normalizeAjioProductUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl, "https://www.ajio.com");
    url.search = "";
    return url.href;
  } catch {
    return rawUrl;
  }
}

function parsePriceToNumber(rawValue: string | null | undefined) {
  if (!rawValue) return Number.NaN;
  const compact = rawValue.replace(/\s+/g, "");
  const matched = compact.match(/(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+(?:\.\d+)?)/);
  if (!matched?.[1]) return Number.NaN;
  return Number(matched[1].replace(/,/g, ""));
}

function formatPriceInr(price: number) {
  if (!Number.isFinite(price)) return null;
  return `₹${Math.round(price).toLocaleString("en-IN")}`;
}

function sanitizeFlipkartTitle(title: string) {
  const cleaned = title
    .replace(/^\d+\.\s*/, "")
    .replace(/currently\s*unavailable/gi, "")
    .replace(/coming\s*soon/gi, "")
    .replace(/add\s*to\s*compare/gi, "")
    .replace(/\b\d+(?:,\d+)*\s*ratings?\s*&\s*\d+(?:,\d+)*\s*reviews?\b/gi, "")
    .replace(/\b\d+(?:\.\d+)?\s*&\s*\d+(?:,\d+)*\s*reviews?\b/gi, "")
    .replace(/\b\d+(?:,\d+)*\s*ratings?\b/gi, "")
    .replace(/\b\d+(?:,\d+)*\s*reviews?\b/gi, "")
    .replace(/\b\d+\s*gb\s*rom\b/gi, "")
    .replace(/\b\d+(?:\.\d+)?\s*cm\s*\([^)]*\)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const noiseCut = cleaned.search(/\b(reviews?|ratings?|rom|super retina|retina xdr|display|front camera|rear camera)\b/i);
  if (noiseCut > 18) {
    return cleaned.slice(0, noiseCut).replace(/\s{2,}/g, " ").trim();
  }

  return cleaned;
}

async function fetchOgImage(productUrl: string) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(productUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "accept-language": "en-IN,en;q=0.9",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const html = await res.text();
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const image = ogImageMatch?.[1] || null;
    if (!image) return null;
    if (image.startsWith("//")) return `https:${image}`;
    if (image.startsWith("http")) return image;
    return null;
  } catch {
    return null;
  }
}

function dedupeProductsPerStore(items: ProductItem[]) {
  return items.filter((item, index, arr) => {
    const scopedKey = `${(item.source || item.store || "unknown").toLowerCase()}::${item.url || `${item.title}:${item.price}`}`;
    return (
      arr.findIndex((candidate) => {
        const candidateKey = `${(candidate.source || candidate.store || "unknown").toLowerCase()}::${candidate.url || `${candidate.title}:${candidate.price}`}`;
        return candidateKey === scopedKey;
      }) === index
    );
  });
}

function buildRelaxedQuery(query: string) {
  const removableTokens = new Set(["pro", "max", "plus", "ultra", "mini", "se", "fe"]);
  const relaxed = query
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !/^\d+$/.test(token))
    .filter((token) => !removableTokens.has(token.toLowerCase()))
    .join(" ")
    .trim();

  return relaxed.length >= 2 ? relaxed : query;
}

function optimizeSearchQuery(rawQuery: string) {
  const typoMap: Array<[RegExp, string]> = [
    [/\bipone\b/gi, "iphone"],
    [/\biphon\b/gi, "iphone"],
    [/\bifone\b/gi, "iphone"],
    [/\bone\s*plus\b/gi, "oneplus"],
  ];

  let query = rawQuery.trim();
  for (const [pattern, replacement] of typoMap) {
    query = query.replace(pattern, replacement);
  }

  query = query
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  return query.length >= 2 ? query : rawQuery;
}

async function gotoWithRetry(page: Awaited<ReturnType<(typeof import("puppeteer"))["default"]["launch"]>> extends infer _T ? any : any, url: string, retries = 1) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(700 + attempt * 600);
      }
    }
  }
  throw lastError;
}

async function looksBlocked(page: any) {
  const bodyText = await page.$eval("body", (el: any) => (el.textContent || "").toLowerCase());
  return /captcha|enter the characters you see below|sorry, we just need to make sure|robot check|automated access/i.test(
    bodyText
  );
}

async function scrapeAmazon(query: string, limit = 24) {
  const { default: puppeteer } = await import("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty((globalThis as any).navigator, "webdriver", { get: () => false });
  });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-IN,en;q=0.9",
  });

  try {
    const queryLooksLikeDevice = /\b(phone|iphone|samsung|pixel|oneplus|mobile|laptop|macbook|tablet)\b/i.test(
      query
    );
    const effectiveQuery = query;
    const searchBaseUrl = `https://www.amazon.in/s?k=${encodeURIComponent(effectiveQuery)}${queryLooksLikeDevice ? "&i=electronics" : ""}`;

    const extractPageItems = async (): Promise<AmazonScrapedItem[]> =>
      page.$$eval('[data-component-type="s-search-result"]', (cards: any[]) => {
      return cards
        .map((card: any) => {
          const titleCandidates = [
            card.querySelector("h2 a span")?.textContent,
            card.querySelector("h2 span.a-text-normal")?.textContent,
            card.querySelector("span[data-cy='title-recipe-title']")?.textContent,
            card.querySelector("img.s-image")?.getAttribute("alt"),
            ...Array.from(card.querySelectorAll("a span") as any[]).map((el: any) => el.textContent),
          ]
            .map((t) => t?.trim() || "")
            .filter((t) => t.length > 0);

          const title =
            titleCandidates.sort((a, b) => b.length - a.length)[0] || null;

          const anchors = Array.from(card.querySelectorAll("a[href]") as any[]);
          const linkEl =
            anchors.find((a: any) => /\/(dp|gp\/product)\//.test(a.getAttribute("href") || "")) ||
            card.querySelector("h2 a") ||
            anchors[0] ||
            null;

          const wholeEl = card.querySelector(".a-price .a-price-whole");
          const fracEl = card.querySelector(".a-price .a-price-fraction");
          const offscreenPriceEl = card.querySelector(".a-price .a-offscreen");
          const imageEl = card.querySelector("img.s-image");
          const ratingEl = card.querySelector("span.a-icon-alt");

          const rawLink = linkEl?.getAttribute("href") || null;
          const offscreenPrice = offscreenPriceEl?.textContent?.trim() || null;
          const whole = wholeEl?.textContent?.replace(/[^\d]/g, "") || "";
          const fraction = fracEl?.textContent?.replace(/[^\d]/g, "") || "00";
          const image = imageEl?.getAttribute("src") || null;
          const rating = ratingEl?.textContent?.trim() || null;

          let price = Number.NaN;
          let priceText = null;

          if (offscreenPrice) {
            const numeric = offscreenPrice.replace(/[^\d.]/g, "");
            price = Number(numeric);
            priceText = offscreenPrice;
          } else if (whole) {
            price = Number(`${whole}.${fraction}`);
            priceText = `₹${Number(whole).toLocaleString("en-IN")}`;
          }

          if (!title || !Number.isFinite(price)) return null;

          const url = rawLink
            ? rawLink.startsWith("http")
              ? rawLink
              : `https://www.amazon.in${rawLink}`
            : null;

          if (url && (url.includes("/sspa/") || url.includes("slredirect"))) return null;

          return {
            title,
            price,
            priceText,
            rating,
            image,
            url,
          };
        })
        .filter((item): item is AmazonScrapedItem => Boolean(item));
      });

    const maxPages = queryLooksLikeDevice ? 3 : 2;
    const collectedRawItems: AmazonScrapedItem[] = [];

    for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
      const pageUrl = `${searchBaseUrl}&page=${pageNo}`;
      await gotoWithRetry(page, pageUrl, 2);

      if (pageNo === 1) {
        if (await looksBlocked(page)) {
          return {
            ok: false,
            blocked: true,
            store: "Amazon India",
            query,
            message: "CAPTCHA encountered. Please retry after some time.",
            items: [],
          };
        }
      }

      const hasResults = await page
        .waitForSelector('[data-component-type="s-search-result"]', { timeout: 25000 })
        .then(() => true)
        .catch(() => false);

      if (!hasResults) {
        await page.evaluate(() => {
          const win = (globalThis as any).window;
          const doc = (globalThis as any).document;
          win?.scrollTo?.(0, (doc?.body?.scrollHeight || 0) * 0.5);
        });
        await sleep(450);
      }

      const hasResultsAfterRetry = hasResults
        ? true
        : await page
            .waitForSelector('[data-component-type="s-search-result"]', { timeout: 7000 })
            .then(() => true)
            .catch(() => false);

      if (!hasResultsAfterRetry) {
        if (pageNo === 1) {
          return {
            ok: true,
            blocked: false,
            store: "Amazon India",
            query,
            fetchedAt: new Date().toISOString(),
            count: 0,
            items: [],
          };
        }
        break;
      }

      const pageItems = await extractPageItems();
      if (!pageItems.length && pageNo > 1) break;

      collectedRawItems.push(...pageItems);
      if (collectedRawItems.length >= 180) break;

      if (pageNo < maxPages) {
        await sleep(350 + Math.floor(Math.random() * 500));
      }
    }

    const rawItems = collectedRawItems
      .map((item) => ({
        ...item,
        url: normalizeAmazonProductUrl(item.url),
      }))
      .filter((item, index, arr) => {
      const key = item.url || `${item.title}:${item.price}`;
      return arr.findIndex((x) => (x.url || `${x.title}:${x.price}`) === key) === index;
      });

    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);

    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/([a-z])(\d)/g, "$1 $2")
        .replace(/(\d)([a-z])/g, "$1 $2")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const stopWords = new Set([
      "the",
      "and",
      "for",
      "with",
      "from",
      "inch",
      "cm",
      "new",
      "latest",
      "model",
    ]);

    const accessoryWords = new Set([
      "case",
      "cases",
      "cover",
      "covers",
      "tempered",
      "protector",
      "screen",
      "charger",
      "charging",
      "cable",
      "adapter",
      "skin",
      "back",
      "guard",
      "battery",
      "earbuds",
      "headphones",
      "magsafe",
      "silicone",
      "bumper",
      "holder",
      "stand",
      "wallet",
      "lens",
    ]);

    const queryAccessoryIntent = query
      .toLowerCase()
      .split(/\s+/)
      .some((t) => accessoryWords.has(t));

    const qualifierWords = new Set([
      "pro",
      "max",
      "plus",
      "ultra",
      "mini",
      "se",
      "fe",
      "air",
      "note",
      "nord",
    ]);
    const unitWords = new Set(["cm", "mm", "inch", "inches", "hz", "mah", "mp", "nm"]);

    const matchesToken = (title: string, token: string) => {
      const words = title.split(" ").filter(Boolean);
      if (/^\d+$/.test(token)) {
        return words.some((w, i) => {
          if (w !== token) return false;
          const next = words[i + 1] || "";
          const afterNext = words[i + 2] || "";
          const looksLikeDecimalDimension = /^\d+$/.test(next) && unitWords.has(afterNext);
          return !looksLikeDecimalDimension;
        });
      }
      return title.includes(token);
    };

    const compatibilityRegex = /\b(for|compatible with|designed for|fits|fit for|works with)\b/;

    const normalizedQuery = normalize(query);
    const mustTokens = tokens.filter((t) => /^\d+$/.test(t) || (t.length > 2 && !stopWords.has(t)));
    const numberTokens = mustTokens.filter((t) => /^\d+$/.test(t));
    const textTokens = mustTokens.filter((t) => !/^\d+$/.test(t));
    const queryQualifierTokens = textTokens.filter((t) => qualifierWords.has(t));
    const minimumTokenHits = Math.max(
      1,
      Math.floor(mustTokens.length * (queryLooksLikeDevice && !queryAccessoryIntent ? 0.67 : 0.5))
    );

    const brandMatchers: Array<{ query: RegExp; title: RegExp }> = [
      { query: /\b(iphone|apple)\b/, title: /\b(iphone|apple)\b/ },
      { query: /\b(samsung|galaxy)\b/, title: /\b(samsung|galaxy)\b/ },
      { query: /\b(oneplus)\b/, title: /\b(oneplus)\b/ },
      { query: /\b(oppo)\b/, title: /\b(oppo)\b/ },
      { query: /\b(vivo|iqoo)\b/, title: /\b(vivo|iqoo)\b/ },
      { query: /\b(xiaomi|redmi|mi)\b/, title: /\b(xiaomi|redmi|mi)\b/ },
      { query: /\b(pixel|google)\b/, title: /\b(pixel|google)\b/ },
    ];
    const brandRule = brandMatchers.find((b) => b.query.test(normalizedQuery)) || null;

    let ranked = rawItems
      .map((item) => {
        const title = normalize(item.title);
        const titleTokens = new Set(title.split(" ").filter(Boolean));
        const mustMatches = mustTokens.filter((t) => matchesToken(title, t)).length;
        const allNumberTokensMatched = numberTokens.every((t) => matchesToken(title, t));
        const exactIncludes = normalizedQuery.length > 0 && title.includes(normalizedQuery);
        const coverage = mustTokens.length ? mustMatches / mustTokens.length : 1;
        const hasAccessoryWord = [...accessoryWords].some((w) => titleTokens.has(w));
        const hasCompatibilityPhrase = compatibilityRegex.test(title);
        const isAccessoryLike = hasAccessoryWord || hasCompatibilityPhrase;
        const tokenHits = mustMatches;
        const hasEnoughTokenHits = tokenHits >= minimumTokenHits;
        const hasAllQualifiers = queryQualifierTokens.every((t) => matchesToken(title, t));
        const isModelSpecificQuery = queryQualifierTokens.length > 0 || numberTokens.length > 0;
        const matchesBrand = brandRule ? brandRule.title.test(title) : true;
        const score =
          (exactIncludes ? 120 : 0) +
          (matchesBrand ? 30 : -80) +
          (hasAllQualifiers ? 25 : -40) +
          (allNumberTokensMatched ? 30 : 0) +
          Math.round(coverage * 50) -
          (isAccessoryLike ? 120 : 0);

        return {
          ...item,
          _score: score,
          _coverage: coverage,
          _allNumberTokensMatched: allNumberTokensMatched,
          _isAccessoryLike: isAccessoryLike,
          _hasEnoughTokenHits: hasEnoughTokenHits,
          _hasAllQualifiers: hasAllQualifiers,
          _isModelSpecificQuery: isModelSpecificQuery,
          _matchesBrand: matchesBrand,
          _tokenHits: tokenHits,
        };
      })
      .filter((item) => {
        if (!mustTokens.length) return true;
        if (numberTokens.length > 0 && !item._allNumberTokensMatched) return false;
        if (queryLooksLikeDevice && !queryAccessoryIntent && item._isAccessoryLike) return false;
        if (queryLooksLikeDevice && !queryAccessoryIntent && !item._hasEnoughTokenHits) return false;
        if (queryLooksLikeDevice && !queryAccessoryIntent && !item._matchesBrand) return false;
        if (item._score >= 100) return true;
        return item._coverage >= 0.67;
      })
      .sort((a, b) => b._score - a._score);

    if (ranked.length === 0 && queryLooksLikeDevice && !queryAccessoryIntent) {
      ranked = rawItems
        .map((item) => {
          const title = normalize(item.title);
          const titleTokens = new Set(title.split(" ").filter(Boolean));
          const tokenHits = mustTokens.filter((t) => matchesToken(title, t)).length;
          const allNumberTokensMatched = numberTokens.every((t) => matchesToken(title, t));
          const hasAccessoryWord = [...accessoryWords].some((w) => titleTokens.has(w));
          const hasCompatibilityPhrase = compatibilityRegex.test(title);
          const isAccessoryLike = hasAccessoryWord || hasCompatibilityPhrase;
          const coverage = mustTokens.length ? tokenHits / mustTokens.length : 1;

          return {
            ...item,
            _score: tokenHits * 30 + (allNumberTokensMatched ? 20 : 0),
            _coverage: coverage,
            _allNumberTokensMatched: allNumberTokensMatched,
            _isAccessoryLike: isAccessoryLike,
            _hasEnoughTokenHits: tokenHits >= minimumTokenHits,
            _hasAllQualifiers: queryQualifierTokens.every((t) => matchesToken(title, t)),
            _isModelSpecificQuery: queryQualifierTokens.length > 0 || numberTokens.length > 0,
            _matchesBrand: brandRule ? brandRule.title.test(title) : true,
            _tokenHits: tokenHits,
          };
        })
        .filter((item) => {
          if (numberTokens.length > 0 && !item._allNumberTokensMatched) return false;
          if (item._isAccessoryLike) return false;
          if (!item._matchesBrand) return false;
          return item._tokenHits >= minimumTokenHits;
        })
        .sort((a, b) => b._score - a._score);
    }

    const dedupedRanked = ranked
      .filter((item, index, arr) => {
        const key = item.url || item.title;
        return arr.findIndex((x) => (x.url || x.title) === key) === index;
      });

    const exactRanked = dedupedRanked
      .filter((item) => {
        if (queryLooksLikeDevice && !queryAccessoryIntent) {
          return (
            item._matchesBrand &&
            item._allNumberTokensMatched &&
            item._hasAllQualifiers &&
            !item._isAccessoryLike
          );
        }
        return item._score >= 120 || item._coverage >= 0.85;
      })
      .slice(0, Math.max(1, Math.min(limit, 60)));

    const relatedRanked = dedupedRanked
      .filter((item) => {
        const inExact = exactRanked.some((x) => (x.url || x.title) === (item.url || item.title));
        if (inExact) return false;
        if (queryLooksLikeDevice && !queryAccessoryIntent && item._isAccessoryLike) return false;
        return item._score >= 40 || item._coverage >= 0.5;
      })
      .slice(0, Math.max(1, Math.min(limit, 60)));

    const stripMeta = ({ _score, _coverage, _allNumberTokensMatched, _isAccessoryLike, _hasEnoughTokenHits, _hasAllQualifiers, _isModelSpecificQuery, _matchesBrand, _tokenHits, ...item }: any) => item;

    const exactItems = exactRanked.map(stripMeta);
    const relatedItems = relatedRanked.map(stripMeta);
    const items = (exactItems.length > 0 ? exactItems : relatedItems).slice(0, Math.max(1, Math.min(limit, 60)));

    return {
      ok: true,
      blocked: false,
      store: "Amazon India",
      query,
      effectiveQuery,
      fetchedAt: new Date().toISOString(),
      exactCount: exactItems.length,
      relatedCount: relatedItems.length,
      allScrapedCount: rawItems.length,
      allScrapedItems: rawItems,
      exactItems,
      relatedItems,
      count: items.length,
      items,
    };
  } finally {
    await browser.close();
  }
}

async function scrapeFlipkart(query: string, limit = 24): Promise<StoreScrapeResult> {
  const { default: puppeteer } = await import("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-IN,en;q=0.9",
  });

  try {
    const maxPages = 2;
    const collectedItems: ProductItem[] = [];

    for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
      const pageUrls = [
        `https://www.flipkart.com/search?q=${encodeURIComponent(query)}&page=${pageNo}`,
        `https://www.flipkart.com/search?q=${encodeURIComponent(query)}&page=${pageNo}&marketplace=FLIPKART&as-show=on&as=off`,
      ];

      let navigated = false;
      for (const pageUrl of pageUrls) {
        try {
          await gotoWithRetry(page, pageUrl, 2);
          navigated = true;
          break;
        } catch {
          // Try next URL variant
        }
      }

      if (!navigated) continue;

      if (pageNo === 1) {
        await page.keyboard.press("Escape").catch(() => undefined);
        await page
          .evaluate(() => {
            const doc = (globalThis as any).document;
            const closeSelectors = [
              "button._2KpZ6l._2doB4z",
              "button[aria-label='Close']",
              "button[class*='close']",
            ];
            for (const selector of closeSelectors) {
              const closeButton = doc?.querySelector?.(selector) as any;
              if (closeButton && typeof closeButton.click === "function") {
                closeButton.click();
                break;
              }
            }
          })
          .catch(() => undefined);
      }

      if (pageNo === 1 && (await looksBlocked(page))) {
        return {
          ok: false,
          blocked: true,
          store: "Flipkart",
          provider: "flipkart",
          source: "flipkart",
          query,
          count: 0,
          items: [],
          message: "Flipkart anti-bot page encountered. Please retry after some time.",
        };
      }

      await page.waitForSelector("a[href*='/p/'], div[data-id]", { timeout: 7000 }).catch(() => undefined);
      await page.evaluate(() => {
        const win = (globalThis as any).window;
        const doc = (globalThis as any).document;
        win?.scrollTo?.(0, Math.max(1000, (doc?.body?.scrollHeight || 0) * 0.65));
      }).catch(() => undefined);
      await sleep(300);

      const pageItems = await page.evaluate(() => {
        const doc = (globalThis as any).document;
        const parseDomCard = (current: any) => {
          const title =
            current?.querySelector?.("a[title]")?.getAttribute?.("title")?.trim?.() ||
            current?.querySelector?.("div.KzDlHZ")?.textContent?.trim?.() ||
            current?.querySelector?.("div._4rR01T")?.textContent?.trim?.() ||
            current?.querySelector?.("a.wjcEIp")?.textContent?.trim?.() ||
            null;

          const priceText =
            current?.querySelector?.("div.Nx9bqj")?.textContent?.trim?.() ||
            current?.querySelector?.("div._30jeq3")?.textContent?.trim?.() ||
            current?.textContent?.match?.(/₹\s?[\d,]+(?:\.\d+)?/)?.[0] ||
            null;

          const rating =
            current?.querySelector?.("div.XQDdHH")?.textContent?.trim?.() ||
            current?.querySelector?.("span._2_R_DZ")?.textContent?.trim?.() ||
            null;

          const image =
            current?.querySelector?.("img")?.getAttribute?.("src") ||
            current?.querySelector?.("img")?.getAttribute?.("data-src") ||
            current?.querySelector?.("img")?.getAttribute?.("srcset")?.split?.(",")?.pop?.()?.trim?.()?.split?.(" ")?.[0] ||
            current?.querySelector?.("img")?.getAttribute?.("data-srcset")?.split?.(",")?.pop?.()?.trim?.()?.split?.(" ")?.[0] ||
            null;

          const anchor =
            current?.querySelector?.("a[href*='/p/']") ||
            (typeof current?.getAttribute === "function" && (current.getAttribute("href") || "").includes("/p/") ? current : null);
          const href = anchor?.getAttribute?.("href") || null;

          if (!title || !priceText) return null;
          return {
            title,
            priceText,
            rating,
            image,
            url: href ? (href.startsWith("http") ? href : `https://www.flipkart.com${href}`) : null,
          };
        };

        const cardSelectors = "div[data-id], div[class*='slAVV4'], div._1AtVbE, article, li";
        const cards = Array.from(doc?.querySelectorAll?.(cardSelectors) || []) as any[];
        const directItems = cards.map(parseDomCard).filter(Boolean) as Array<{ title: string; priceText: string; rating: string | null; image: string | null; url: string | null }>;

        const anchorFallback = (Array.from(doc?.querySelectorAll?.("a[href*='/p/']") || []) as any[])
          .slice(0, 300)
          .map((anchor) => {
            const container =
              anchor?.closest?.("div[data-id], div._1AtVbE, div[class*='slAVV4'], article, li") ||
              anchor?.parentElement ||
              anchor;
            return parseDomCard(container);
          })
          .filter(Boolean) as Array<{ title: string; priceText: string; rating: string | null; image: string | null; url: string | null }>;

        const anchorHeuristic = (Array.from(doc?.querySelectorAll?.("a[href*='/p/']") || []) as any[])
          .slice(0, 400)
          .map((anchor) => {
            const href = anchor?.getAttribute?.("href") || null;
            if (!href || !href.includes("/p/")) return null;

            const container =
              anchor?.closest?.("div[data-id], div._1AtVbE, div[class*='slAVV4'], article, li") ||
              anchor?.parentElement ||
              anchor;

            const title =
              anchor?.getAttribute?.("title")?.trim?.() ||
              anchor?.textContent?.trim?.() ||
              container?.querySelector?.("a[title]")?.getAttribute?.("title")?.trim?.() ||
              container?.querySelector?.("div.KzDlHZ")?.textContent?.trim?.() ||
              null;

            const contextText = container?.textContent || "";
            const priceText =
              contextText.match(/₹\s?[\d,]+(?:\.\d+)?/)?.[0] ||
              container?.querySelector?.("div.Nx9bqj")?.textContent?.trim?.() ||
              container?.querySelector?.("div._30jeq3")?.textContent?.trim?.() ||
              null;

            const image =
              container?.querySelector?.("img")?.getAttribute?.("src") ||
              container?.querySelector?.("img")?.getAttribute?.("data-src") ||
              null;

            if (!title || !priceText) return null;
            return {
              title,
              priceText,
              rating: null,
              image,
              url: href.startsWith("http") ? href : `https://www.flipkart.com${href}`,
            };
          })
          .filter(Boolean) as Array<{ title: string; priceText: string; rating: string | null; image: string | null; url: string | null }>;

        const jsonLdItems: Array<{ title: string; priceText: string; rating: string | null; image: string | null; url: string | null }> = [];
        const scripts = Array.from(doc?.querySelectorAll?.("script[type='application/ld+json']") || []) as any[];
        for (const script of scripts) {
          const raw = script?.textContent?.trim?.();
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            const normalized = Array.isArray(parsed) ? parsed : [parsed];
            for (const node of normalized) {
              const list = node?.itemListElement;
              if (!Array.isArray(list)) continue;
              for (const entry of list) {
                const item = entry?.item || entry;
                const title = item?.name || null;
                const url = item?.url || null;
                const priceRaw = item?.offers?.price ?? item?.offers?.lowPrice ?? null;
                const priceText = priceRaw != null ? `₹${String(priceRaw)}` : null;
                const image = Array.isArray(item?.image) ? item.image[0] : item?.image || null;
                if (!title || !priceText) continue;
                jsonLdItems.push({
                  title: String(title),
                  priceText,
                  rating: null,
                  image: typeof image === "string" ? image : image?.url || null,
                  url: url ? (String(url).startsWith("http") ? String(url) : `https://www.flipkart.com${String(url)}`) : null,
                });
              }
            }
          } catch {
            // Ignore malformed JSON-LD
          }
        }

        return [...directItems, ...anchorFallback, ...anchorHeuristic, ...jsonLdItems];
      }) as Array<{ title: string; priceText: string; rating: string | null; image: string | null; url: string | null } | null>;

      const validPageItems = pageItems.filter(
        (item): item is { title: string; priceText: string; rating: string | null; image: string | null; url: string | null } => Boolean(item)
      );

      for (const item of validPageItems) {
        const price = parsePriceToNumber(item.priceText);
        if (!Number.isFinite(price)) continue;
        const cleanedTitle = sanitizeFlipkartTitle(item.title);
        const normalizedImage = item.image?.startsWith("//") ? `https:${item.image}` : item.image;
        collectedItems.push({
          title: cleanedTitle || item.title,
          price,
          priceText: formatPriceInr(price) || item.priceText,
          rating: item.rating,
          image: normalizedImage,
          url: normalizeFlipkartProductUrl(item.url),
          store: "Flipkart",
          source: "flipkart",
        });
      }

      if (collectedItems.length >= 120) break;
      if (pageNo < maxPages) await sleep(300 + Math.floor(Math.random() * 400));
    }

    const deduped = dedupeProducts(collectedItems).slice(0, Math.max(limit * 3, 24));

    const needsImage = deduped
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (!item.url) return false;
        if (!item.image) return true;
        const img = item.image.trim().toLowerCase();
        return img.startsWith("data:image") || img.includes("placeholder");
      })
      .slice(0, 20);

    await Promise.all(
      needsImage.map(async ({ item, index }) => {
        const ogImage = await fetchOgImage(item.url as string);
        if (!ogImage) return;
        deduped[index] = {
          ...deduped[index],
          image: ogImage,
        };
      })
    );

    return {
      ok: true,
      blocked: false,
      store: "Flipkart",
      provider: "flipkart",
      source: "flipkart",
      query,
      count: deduped.length,
      items: deduped,
    };
  } finally {
    await browser.close();
  }
}

async function scrapeMyntra(query: string, limit = 24): Promise<StoreScrapeResult> {
  const { default: puppeteer } = await import("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-IN,en;q=0.9",
  });

  try {
    const searchUrl = `https://www.myntra.com/${encodeURIComponent(query)}?rawQuery=${encodeURIComponent(query)}`;
    await gotoWithRetry(page, searchUrl, 2);

    if (await looksBlocked(page)) {
      return {
        ok: false,
        blocked: true,
        store: "Myntra",
        provider: "myntra",
        source: "myntra",
        query,
        count: 0,
        items: [],
        message: "Myntra anti-bot page encountered. Please retry after some time.",
      };
    }

    const pageItems = await page.evaluate(() => {
      const doc = (globalThis as any).document;
      const cards = Array.from(doc?.querySelectorAll?.("li.product-base") || []) as any[];
      return cards
        .map((card) => {
          const current = card as any;
          const brand = current.querySelector("h3.product-brand")?.textContent?.trim() || "";
          const productName = current.querySelector("h4.product-product")?.textContent?.trim() || "";
          const title = [brand, productName].filter(Boolean).join(" ").trim() || null;

          const priceText =
            current.querySelector("span.product-discountedPrice")?.textContent?.trim() ||
            current.querySelector("span.product-price")?.textContent?.trim() ||
            null;

          const rating = current.querySelector("span.product-ratingsContainer")?.textContent?.trim() || null;
          const image = current.querySelector("img")?.getAttribute("src") || current.querySelector("img")?.getAttribute("data-src") || null;
          const href = current.querySelector("a")?.getAttribute("href") || null;

          if (!title || !priceText) return null;

          return {
            title,
            priceText,
            rating,
            image,
            url: href ? (href.startsWith("http") ? href : `https://www.myntra.com${href}`) : null,
          };
        })
        .filter(Boolean);
      }) as Array<{ title: string; priceText: string; rating: string | null; image: string | null; url: string | null } | null>;

    const normalized = pageItems
      .filter(
        (item): item is { title: string; priceText: string; rating: string | null; image: string | null; url: string | null } => Boolean(item)
      )
      .map((item) => {
        const price = parsePriceToNumber(item.priceText);
        if (!Number.isFinite(price)) return undefined;
        return {
          title: item.title,
          price,
          priceText: item.priceText,
          rating: item.rating,
          image: item.image,
          url: normalizeMyntraProductUrl(item.url),
          store: "Myntra",
          source: "myntra",
        } as ProductItem;
      })
      .filter((item): item is ProductItem => Boolean(item));

    const deduped = dedupeProducts(normalized).slice(0, Math.max(limit * 3, 24));
    return {
      ok: true,
      blocked: false,
      store: "Myntra",
      provider: "myntra",
      source: "myntra",
      query,
      count: deduped.length,
      items: deduped,
    };
  } finally {
    await browser.close();
  }
}

async function scrapeAjio(query: string, limit = 24): Promise<StoreScrapeResult> {
  const { default: puppeteer } = await import("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-IN,en;q=0.9",
  });

  try {
    const searchUrl = `https://www.ajio.com/search/?text=${encodeURIComponent(query)}`;
    await gotoWithRetry(page, searchUrl, 2);

    if (await looksBlocked(page)) {
      return {
        ok: false,
        blocked: true,
        store: "AJIO",
        provider: "ajio",
        source: "ajio",
        query,
        count: 0,
        items: [],
        message: "AJIO anti-bot page encountered. Please retry after some time.",
      };
    }

    const pageItems = await page.evaluate(() => {
      const doc = (globalThis as any).document;
      const cards = Array.from(doc?.querySelectorAll?.("div.item.rilrtl-products-list__item, div.item") || []) as any[];
      return cards
        .map((card) => {
          const current = card as any;
          const title =
            current.querySelector("div.nameCls")?.textContent?.trim() ||
            current.querySelector("div.brand")?.textContent?.trim() ||
            current.querySelector("div.name")?.textContent?.trim() ||
            current.querySelector("a[title]")?.getAttribute("title")?.trim() ||
            null;

          const priceText =
            current.querySelector("span.price")?.textContent?.trim() ||
            current.querySelector("div.price")?.textContent?.trim() ||
            null;

          const image =
            current.querySelector("img")?.getAttribute("src") ||
            current.querySelector("img")?.getAttribute("data-src") ||
            null;

          const href =
            current.querySelector("a")?.getAttribute("href") ||
            current.getAttribute?.("href") ||
            null;

          if (!title || !priceText) return null;

          return {
            title,
            priceText,
            rating: null,
            image,
            url: href ? (href.startsWith("http") ? href : `https://www.ajio.com${href}`) : null,
          };
        })
        .filter(Boolean);
    }) as Array<{ title: string; priceText: string; rating: string | null; image: string | null; url: string | null } | null>;

    const normalized = pageItems
      .filter(
        (item): item is { title: string; priceText: string; rating: string | null; image: string | null; url: string | null } => Boolean(item)
      )
      .map((item) => {
        const price = parsePriceToNumber(item.priceText);
        if (!Number.isFinite(price)) return undefined;
        return {
          title: item.title,
          price,
          priceText: item.priceText,
          rating: item.rating,
          image: item.image,
          url: normalizeAjioProductUrl(item.url),
          store: "AJIO",
          source: "ajio",
        } as ProductItem;
      })
      .filter((item): item is ProductItem => Boolean(item));

    const deduped = dedupeProducts(normalized).slice(0, Math.max(limit * 3, 24));
    return {
      ok: true,
      blocked: false,
      store: "AJIO",
      provider: "ajio",
      source: "ajio",
      query,
      count: deduped.length,
      items: deduped,
    };
  } finally {
    await browser.close();
  }
}

function clampLimit(value: number) {
  return Number.isFinite(value) ? Math.max(1, Math.min(Math.trunc(value), 60)) : 24;
}

async function scrapeProducts(query: string, limit = 24) {
  const amazonData = await scrapeAmazon(query, limit);
  return { ...amazonData, provider: "amazon", source: "amazon", storesSearched: ["amazon"] };
}

async function scrapeProductsAcrossStores(query: string, limit = 24, stores: StoreKey[] = ["amazon", "flipkart", "myntra", "ajio"]) {
  const selectedStores = stores.length ? stores : ["amazon", "flipkart", "myntra", "ajio"];
  const optimizedQuery = optimizeSearchQuery(query);
  const perStoreTimeoutMs = 20000;
  const tasks = selectedStores.map(async (store) => {
    if (store === "amazon") {
      const data = await withTimeout(
        scrapeAmazon(optimizedQuery, limit),
        perStoreTimeoutMs,
        `Timeout while scraping ${store}`
      );
      const sourceItems = Array.isArray((data as { allScrapedItems?: unknown }).allScrapedItems)
        ? ((data as { allScrapedItems: ProductItem[] }).allScrapedItems || [])
        : Array.isArray((data as { items?: unknown }).items)
          ? ((data as { items: ProductItem[] }).items || [])
          : [];
      const items = sourceItems.map((item) => ({ ...item, store: "Amazon India", source: "amazon" }));
      return {
        ok: Boolean((data as { ok?: boolean }).ok),
        blocked: Boolean((data as { blocked?: boolean }).blocked),
        store: "Amazon India",
        provider: "amazon" as const,
        source: "amazon" as const,
        query: optimizedQuery,
        count: items.length,
        items,
      } satisfies StoreScrapeResult;
    }
    if (store === "flipkart") {
      return withTimeout(scrapeFlipkart(optimizedQuery, limit), 18000, `Timeout while scraping ${store}`);
    }
    if (store === "myntra") {
      return withTimeout(scrapeMyntra(optimizedQuery, limit), perStoreTimeoutMs, `Timeout while scraping ${store}`);
    }
    return withTimeout(scrapeAjio(optimizedQuery, limit), perStoreTimeoutMs, `Timeout while scraping ${store}`);
  });

  const settled = await Promise.allSettled(tasks);
  const successful = settled
    .filter((entry): entry is PromiseFulfilledResult<StoreScrapeResult> => entry.status === "fulfilled")
    .map((entry) => entry.value);

  let allItems = dedupeProductsPerStore(successful.flatMap((entry) => entry.items));
  let effectiveQuery = optimizedQuery;
  let fallbackUsed = false;

  if (allItems.length === 0) {
    try {
      const directAmazon = await scrapeAmazon(optimizedQuery, Math.max(limit, 24));
      const directItems = Array.isArray((directAmazon as { allScrapedItems?: unknown }).allScrapedItems)
        ? ((directAmazon as { allScrapedItems: ProductItem[] }).allScrapedItems || [])
        : Array.isArray((directAmazon as { items?: unknown }).items)
          ? ((directAmazon as { items: ProductItem[] }).items || [])
          : [];

      if (directItems.length > 0) {
        allItems = dedupeProductsPerStore(
          directItems.map((item) => ({ ...item, store: item.store || "Amazon India", source: item.source || "amazon" }))
        );
      }
    } catch {
      // ignore direct fallback failure
    }

    const relaxedQuery = buildRelaxedQuery(optimizedQuery);
    if (relaxedQuery !== optimizedQuery) {
      try {
        const relaxedAmazon = await withTimeout(
          scrapeAmazon(relaxedQuery, Math.max(limit, 24)),
          12000,
          "Timeout while scraping relaxed query"
        );
        const relaxedItems = Array.isArray((relaxedAmazon as { allScrapedItems?: unknown }).allScrapedItems)
          ? ((relaxedAmazon as { allScrapedItems: ProductItem[] }).allScrapedItems || [])
          : Array.isArray((relaxedAmazon as { items?: unknown }).items)
            ? ((relaxedAmazon as { items: ProductItem[] }).items || [])
            : [];
        allItems = dedupeProductsPerStore(
          relaxedItems.map((item) => ({ ...item, store: item.store || "Amazon India", source: item.source || "amazon" }))
        );
        if (allItems.length > 0) {
          effectiveQuery = relaxedQuery;
          fallbackUsed = true;
        }
      } catch {
        // Ignore relaxed fallback failures and return original empty response.
      }
    }
  }

  const ranked = rankProducts(effectiveQuery, allItems, { maxResults: Math.max(clampLimit(limit), allItems.length) });
  const fallbackRelatedItems =
    ranked.exactItems.length === 0 && ranked.relatedItems.length === 0 && allItems.length > 0
      ? allItems.slice(0, clampLimit(limit))
      : ranked.relatedItems;

  const allBlocked = successful.length > 0 && successful.every((entry) => entry.blocked);
  const failedStores = settled
    .filter((entry) => entry.status === "rejected")
    .length;

  const rejectedBreakdown = settled
    .map((entry, index) => ({ entry, store: selectedStores[index] }))
    .filter((x): x is { entry: PromiseRejectedResult; store: StoreKey } => x.entry.status === "rejected")
    .map(({ store }) => ({
      store: store === "amazon" ? "Amazon India" : store === "ajio" ? "AJIO" : store.charAt(0).toUpperCase() + store.slice(1),
      provider: store,
      count: 0,
      blocked: false,
      failed: true,
    }));

  const combinedBreakdown = [
    ...successful.map((entry) => ({
      store: entry.store,
      provider: entry.provider,
      count: entry.count,
      blocked: Boolean(entry.blocked),
    })),
    ...rejectedBreakdown,
  ];

  if (allItems.length === 0 && successful.length === 0) {
    return {
      ok: false,
      blocked: allBlocked,
      query,
      effectiveQuery,
      fallbackUsed,
      fetchedAt: new Date().toISOString(),
      provider: "multi",
      source: "multi",
      storesSearched: selectedStores,
      storesResponded: [],
      failedStores,
      storeBreakdown: combinedBreakdown,
      count: 0,
      items: [],
      exactItems: [],
      relatedItems: [],
      message: "All stores timed out or blocked right now. Please retry in a few seconds.",
    };
  }

  return {
    ok: true,
    blocked: allBlocked,
    query,
    effectiveQuery,
    fallbackUsed,
    fetchedAt: new Date().toISOString(),
    provider: "multi",
    source: "multi",
    storesSearched: selectedStores,
    storesResponded: successful.map((entry) => entry.provider),
    failedStores,
    storeBreakdown: combinedBreakdown,
    allScrapedCount: allItems.length,
    allScrapedItems: allItems,
    exactCount: ranked.exactItems.length,
    relatedCount: fallbackRelatedItems.length,
    count: allItems.length,
    exactItems: ranked.exactItems,
    relatedItems: fallbackRelatedItems,
    items: allItems,
    rankedItems: ranked.items,
  };
}

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    dyadComponentTagger(),
    react(),
    {
      name: "live-amazon-scrape-api",
      configureServer(server) {
        server.middlewares.use("/api/scrape/amazon", async (req, res) => {
          if (req.method !== "GET") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: false, message: "Method not allowed" }));
            return;
          }

          try {
            const reqUrl = new URL(req.url || "", "http://localhost");
            const query = reqUrl.searchParams.get("q")?.trim();

            if (!query || query.length < 2) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, message: "Query must be at least 2 characters" }));
              return;
            }

            const limitParam = Number(reqUrl.searchParams.get("limit") || "24");
            const limit = Number.isFinite(limitParam)
              ? Math.max(1, Math.min(Math.trunc(limitParam), 60))
              : 24;

            const key = `v6:${query.toLowerCase()}:limit:${limit}`;
            const cached = scrapeCache.get(key);
            const now = Date.now();

            if (cached && cached.expiresAt > now) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ...(cached.data as object), cached: true }));
              return;
            }

            const inFlightKey = `amazon:v1:${query.toLowerCase()}:limit:${limit}`;
            const existingInFlight = inflightScrapeCache.get(inFlightKey);
            const data = existingInFlight
              ? await existingInFlight
              : await (() => {
                  const promise = scrapeProducts(query, limit) as Promise<unknown>;
                  inflightScrapeCache.set(inFlightKey, promise);
                  return promise.finally(() => {
                    inflightScrapeCache.delete(inFlightKey);
                  });
                })();
            const hasResults =
              typeof data === "object" &&
              data !== null &&
              "count" in data &&
              typeof (data as { count?: unknown }).count === "number" &&
              ((data as { count: number }).count > 0);

            scrapeCache.set(key, {
              expiresAt: now + (hasResults ? 1000 * 60 * 10 : 1000 * 30),
              data,
            });

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                ok: false,
                message: error instanceof Error ? error.message : "Unknown server error",
              })
            );
          }
        });

        server.middlewares.use("/api/scrape/compare", async (req, res) => {
          if (req.method !== "GET") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: false, message: "Method not allowed" }));
            return;
          }

          try {
            const reqUrl = new URL(req.url || "", "http://localhost");
            const query = reqUrl.searchParams.get("q")?.trim();

            if (!query || query.length < 2) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, message: "Query must be at least 2 characters" }));
              return;
            }

            const limit = clampLimit(Number(reqUrl.searchParams.get("limit") || "24"));
            const allowedStores: StoreKey[] = ["amazon", "flipkart", "myntra", "ajio"];
            const requestedStores = (reqUrl.searchParams.get("stores") || "amazon,flipkart,myntra,ajio")
              .split(",")
              .map((store) => store.trim().toLowerCase())
              .filter((store): store is StoreKey => allowedStores.includes(store as StoreKey));
            const stores: StoreKey[] = requestedStores.length ? requestedStores : ["amazon", "flipkart", "myntra", "ajio"];

            const key = `compare:v1:${query.toLowerCase()}:limit:${limit}:stores:${stores.join("|")}`;
            const cached = scrapeCache.get(key);
            const now = Date.now();

            if (cached && cached.expiresAt > now) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ...(cached.data as object), cached: true }));
              return;
            }

            const inFlightKey = `compare:v2:${query.toLowerCase()}:limit:${limit}:stores:${stores.join("|")}`;
            const existingInFlight = inflightScrapeCache.get(inFlightKey);
            const data = existingInFlight
              ? await existingInFlight
              : await (() => {
                  const promise = scrapeProductsAcrossStores(query, limit, stores) as Promise<unknown>;
                  inflightScrapeCache.set(inFlightKey, promise);
                  return promise.finally(() => {
                    inflightScrapeCache.delete(inFlightKey);
                  });
                })();
            const hasResults =
              typeof data === "object" &&
              data !== null &&
              "count" in data &&
              typeof (data as { count?: unknown }).count === "number" &&
              ((data as { count: number }).count > 0);

            scrapeCache.set(key, {
              expiresAt: now + (hasResults ? 1000 * 60 * 8 : 1000 * 20),
              data,
            });

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                ok: false,
                message: error instanceof Error ? error.message : "Unknown server error",
              })
            );
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
