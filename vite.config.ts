import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import dotenv from 'dotenv';
import { dedupeProducts, rankProducts, type ProductItem } from "./src/lib/productSearch";
// Load .env from project root so server middleware (DB helpers) pick up credentials
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import db from './src/lib/db/mysql';

const scrapeCache = new Map<string, { expiresAt: number; data: unknown }>();
const inflightScrapeCache = new Map<string, Promise<unknown>>();

// Shared browser instance to avoid repeated cold launches which are expensive.
let _sharedPuppeteerBrowser: any = null;
async function getSharedBrowser() {
  if (_sharedPuppeteerBrowser) return _sharedPuppeteerBrowser;
  const { default: puppeteer } = await import("puppeteer");
  _sharedPuppeteerBrowser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return _sharedPuppeteerBrowser;
}
async function closeSharedBrowser() {
  try {
    if (_sharedPuppeteerBrowser) {
      await _sharedPuppeteerBrowser.close();
      _sharedPuppeteerBrowser = null;
    }
  } catch {
    _sharedPuppeteerBrowser = null;
  }
}

async function preparePage(browser: any) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-IN,en;q=0.9" });

  // Block fonts, styles and other heavy resources to speed up loads, but allow images
  // so scrapers can read `src`/`srcset` attributes and sites that render thumbnails
  // client-side still populate proper image URLs in the DOM.
  try {
    await page.setRequestInterception(true);
    page.on("request", (req: any) => {
      const type = req.resourceType?.() || "";
      if (["stylesheet", "font", "media", "websocket"].includes(type)) {
        req.abort();
        return;
      }
      req.continue();
    });
  } catch {
    // some puppeteer versions may not support interception in certain environments
  }

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty((globalThis as any).navigator, "webdriver", { get: () => false });
  });

  return page;
}

type AmazonScrapedItem = {
  title: string;
  price: number;
  priceText: string | null;
  mrp: number | null;
  mrpText: string | null;
  discountPercent: number | null;
  savingsAmount: number | null;
  savingsText: string | null;
  couponText: string | null;
  dealType: string | null;
  offerText: string | null;
  hasOffer: boolean;
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

function parseRatingToText(rawValue: string | null | undefined) {
  if (!rawValue) return null;
  // normalize common mojibake / nbsp characters and HTML entities that
  // sometimes appear in Flipkart titles (e.g. "4.Â \u0026Â 13,461 Reviews")
  let compact = String(rawValue)
    .replace(/\u00A0|\u00C2|\u00AD/g, " ") // NBSP, Â, soft hyphen
    .replace(/&nbsp;|&amp;/gi, " ")
    .replace(/[\u2018\u2019\u201C\u201D]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Try to find rating patterns with context (e.g. "4.5 out of 5", "4 & 9,190 Reviews", "4. & 9,190 Reviews").
  // Allow a trailing dot after the rating (Flipkart sometimes shows "4.").
  const ratingMatch =
    compact.match(/([1-5](?:\.\d+)?\.?)\s*(?:\/\s*5|out\s*of\s*5|stars?|★)\b/i) ||
    compact.match(/([1-5](?:\.\d+)?\.?)\s*[\s\u00A0]*[&]\s*[\d,]+\s*reviews?\b/i) ||
    compact.match(/([1-5](?:\.\d+)?\.?)(?=\s*(?:reviews?\b|&|out\s*of))/i);

  if (ratingMatch?.[1]) {
    const normalized = ratingMatch[1].replace(/\.$/, "");
    return `${normalized} out of 5 stars`;
  }

  // aggressive fallback: strip non-ASCII and look for a leading 1-5 near an ampersand or 'Reviews'
  const ascii = compact.replace(/[^\x00-\x7F]/g, " ");
  const fallback =
    ascii.match(/([1-5](?:\.\d+)?\.?)\s*[&\u0026]\s*[\d,]+\s*reviews?\b/i) ||
    ascii.match(/([1-5](?:\.\d+)?\.?)(?=\s*(?:reviews?\b|&|\u0026))/i);
  if (fallback?.[1]) return `${fallback[1].replace(/\.$/, "")} out of 5 stars`;

  return null;
}

function sanitizeFlipkartTitle(title: string) {
  const cleaned = title
    .replace(/^\d+\.\s*/, "")
    .replace(/currently\s*unavailable/gi, "")
    .replace(/coming\s*soon/gi, "")
    .replace(/add\s*to\s*compare/gi, "")
    .replace(/\b\d+(?:,\d+)*\s*ratings?\s*&\s*\d+(?:,\d+)*\s*reviews?\b/gi, "")
    .replace(/\b\d+(?:\.\d+)?\s*&\s*\d+(?:,\d+)*\s*reviews?\b/gi, "")
    .replace(/\b\d(?:\.\d)?\.?\s*&\s*\d+(?:,\d+)*\s*reviews?\b/gi, "")
    .replace(/\b\d+(?:,\d+)*\s*ratings?\b/gi, "")
    .replace(/\b\d+(?:,\d+)*\s*reviews?\b/gi, "")
    .replace(/\b\d(?:\.\d)?\s*(?:out\s*of\s*5|stars?|★)\b/gi, "")
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

async function fetchFlipkartRating(productUrl: string) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
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

    // Try JSON-LD first
    try {
      const ldMatches = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
      for (const m of ldMatches) {
        try {
          const parsed = JSON.parse(m[1]);
          const nodes = Array.isArray(parsed) ? parsed : [parsed];
          for (const node of nodes) {
            const agg = node?.aggregateRating || node?.offers?.aggregateRating || node?.review?.aggregateRating || node?.reviewRating || null;
            const rating = node?.aggregateRating?.ratingValue ?? node?.reviewRating?.ratingValue ?? agg?.ratingValue ?? null;
            if (rating) {
              const val = String(rating).trim().replace(/\.$/, "");
              if (/^[1-5](?:\.\d+)?$/.test(val)) return `${val} out of 5 stars`;
            }
          }
        } catch {}
      }
    } catch {}

    // Try HTML selectors / classes
    const classMatch = html.match(/<div[^>]*class=["'][^"']*_3LWZlK[^"']*["'][^>]*>([\d.]{1,3})<\/div>/i)
      || html.match(/<span[^>]*class=["'][^"']*_3LWZlK[^"']*["'][^>]*>([\d.]{1,3})<\/span>/i)
      || html.match(/ratingValue["']?\s*[:>]\s*["']?([\d.]{1,3})["']?/i)
      || html.match(/aggregateRating[\s\S]{0,120}?ratingValue["']?\s*[:>]\s*["']?([\d.]{1,3})["']?/i);
    if (classMatch?.[1]) {
      const v = classMatch[1].replace(/\.$/, "");
      if (/^[1-5](?:\.\d+)?$/.test(v)) return `${v} out of 5 stars`;
    }

    // Loose regex fallback: look for patterns like '4. & 13,461 Reviews' or '4.5 out of 5'
    const loose = html.replace(/\s+/g, " ").match(/([1-5](?:\.\d)?)(?=\s*(?:&|and|reviews|out of|stars|rating))/i);
    if (loose?.[1]) return `${loose[1].replace(/\.$/, "")} out of 5 stars`;

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

async function gotoWithRetry(page: any, url: string, retries = 1) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // navigation timeout increased to allow heavier pages to load reliably
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(500 + attempt * 400);
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

async function scrapeAmazon(query: string, limit = 24, sharedBrowser?: any) {
  const { default: puppeteer } = await import("puppeteer");
  let browser: any = sharedBrowser;
  let ownBrowser = false;
  if (!browser) {
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    ownBrowser = true;
  }
  const page = await preparePage(browser);

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
          const mrpOffscreenEl =
            card.querySelector(".a-price.a-text-price .a-offscreen") ||
            card.querySelector(".a-text-price .a-offscreen") ||
            card.querySelector("[data-cy='price-recipe'] .a-text-price .a-offscreen");
          const imageEl = card.querySelector("img.s-image");
          const ratingEl = card.querySelector("span.a-icon-alt");

          const dealBadgeCandidates = [
            card.querySelector(".a-badge .a-badge-text")?.textContent,
            card.querySelector("span[aria-label*='Deal']")?.textContent,
            card.querySelector("span[class*='deal']")?.textContent,
            card.querySelector("span[class*='Deal']")?.textContent,
          ]
            .map((t) => t?.trim() || "")
            .filter((t) => t.length > 0);

          const discountRawCandidates = [
            card.querySelector(".savingsPercentage")?.textContent,
            card.querySelector("span[class*='savingsPercentage']")?.textContent,
            card.querySelector("span[class*='percent']")?.textContent,
            ...Array.from(card.querySelectorAll("span") as any[]).map((el: any) => el.textContent),
          ]
            .map((t) => t?.trim() || "")
            .filter((t) => /\d+\s*%\s*off|-\s*\d+\s*%/i.test(t));

          const couponCandidates = Array.from(card.querySelectorAll("span") as any[])
            .map((el: any) => (el.textContent || "").trim())
            .filter((t) => /coupon|save\s*₹|extra\s*\d+%|bank offer|no cost emi|exchange offer/i.test(t));

          const rawLink = linkEl?.getAttribute("href") || null;
          const offscreenPrice = offscreenPriceEl?.textContent?.trim() || null;
          const mrpText = mrpOffscreenEl?.textContent?.trim() || null;
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

          const parsedMrp = mrpText ? Number(mrpText.replace(/[^\d.]/g, "")) : Number.NaN;
          const mrp = Number.isFinite(parsedMrp) && parsedMrp > price ? parsedMrp : null;

          const discountText = discountRawCandidates.find((t) => /\d+\s*%/i.test(t)) || null;
          const discountFromText = discountText
            ? Number((discountText.match(/(\d{1,3})\s*%/) || [])[1])
            : Number.NaN;
          const discountFromMrp = mrp ? Math.round(((mrp - price) / mrp) * 100) : Number.NaN;
          const discountPercent = Number.isFinite(discountFromMrp)
            ? discountFromMrp
            : (Number.isFinite(discountFromText) ? discountFromText : null);

          const savingsAmount = mrp && mrp > price ? Number((mrp - price).toFixed(2)) : null;
          const savingsText = savingsAmount
            ? `Save ₹${Math.round(savingsAmount).toLocaleString("en-IN")}`
            : null;

          const couponText = couponCandidates[0] || null;
          const dealBadge = dealBadgeCandidates[0] || null;
          const dealType =
            dealBadge && /limited\s*time\s*deal/i.test(dealBadge)
              ? "limited-time-deal"
              : (dealBadge && /deal/i.test(dealBadge) ? "deal" : null);

          const offerTextParts = [
            dealBadge,
            discountPercent ? `${discountPercent}% off` : null,
            couponText,
            savingsText,
          ].filter(Boolean);
          const offerText = offerTextParts.length ? offerTextParts.join(" • ") : null;
          const hasOffer = Boolean(dealBadge || couponText || discountPercent || savingsAmount);

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
            mrp,
            mrpText,
            discountPercent,
            savingsAmount,
            savingsText,
            couponText,
            dealType,
            offerText,
            hasOffer,
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
    try {
      await page.close().catch(() => undefined);
    } catch {}
    if (ownBrowser) await browser.close().catch(() => undefined);
  }
}

async function scrapeFlipkart(query: string, limit = 24, sharedBrowser?: any): Promise<StoreScrapeResult> {
  const { default: puppeteer } = await import("puppeteer");
  let browser: any = sharedBrowser;
  let ownBrowser = false;
  if (!browser) {
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    ownBrowser = true;
  }
  const page = await preparePage(browser);

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
        const parseRating = (value: any) => {
          const text = (value || "").toString().replace(/\s+/g, " ").trim();
          if (!text) return null;
          const match =
            text.match(/([1-5](?:\.\d)?\.?)\s*(?:\/\s*5|out\s*of\s*5|stars?|★)\b/i) ||
            text.match(/([1-5](?:\.\d)?\.?)\s*&\s*[\d,]+\s*reviews?\b/i);
          return match?.[1]?.replace?.(/\.$/, "") || null;
        };

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

          const mrpText =
            current?.querySelector?.("div.yRaY8j")?.textContent?.trim?.() ||
            current?.querySelector?.("div._3I9_wc")?.textContent?.trim?.() ||
            current?.querySelector?.("span.yRaY8j")?.textContent?.trim?.() ||
            null;

          const contextText = current?.textContent || "";

          const rating =
            parseRating(current?.querySelector?.("div.XQDdHH")?.textContent) ||
            parseRating(current?.querySelector?.("span.XQDdHH")?.textContent) ||
            parseRating(current?.querySelector?.("span._2_R_DZ")?.textContent) ||
            parseRating(current?.querySelector?.("div._3LWZlK")?.textContent) ||
            parseRating(current?.querySelector?.("span._3LWZlK")?.textContent) ||
            parseRating(current?.querySelector?.("div._1rcHFq")?.textContent) ||
            // class-substring fallback for variants like _3LWZlK mixed into other class names
            parseRating(current?.querySelector?.("[class*='_3LWZlK']")?.textContent) ||
            parseRating(contextText) ||
            null;

          const discountText =
            current?.querySelector?.("div.UkUFwK")?.textContent?.trim?.() ||
            current?.querySelector?.("div._3Ay6Sb span")?.textContent?.trim?.() ||
            contextText.match(/\b\d{1,2}%\s*off\b/i)?.[0] ||
            null;

          const couponText =
            contextText.match(/\b(?:bank offer|coupon|extra\s*₹?\s*[\d,]+\s*off|exchange offer|no cost emi)\b[^\n\r•]*/i)?.[0]?.trim?.() ||
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
            mrpText,
            discountText,
            couponText,
            rating,
            image,
            url: href ? (href.startsWith("http") ? href : `https://www.flipkart.com${href}`) : null,
          };
        };

        const cardSelectors = "div[data-id], div[class*='slAVV4'], div._1AtVbE, article, li";
        const cards = Array.from(doc?.querySelectorAll?.(cardSelectors) || []) as any[];
        const directItems = cards.map(parseDomCard).filter(Boolean) as Array<{ title: string; priceText: string; mrpText?: string | null; discountText?: string | null; couponText?: string | null; rating: string | null; image: string | null; url: string | null }>;

        const anchorFallback = (Array.from(doc?.querySelectorAll?.("a[href*='/p/']") || []) as any[])
          .slice(0, 300)
          .map((anchor) => {
            const container =
              anchor?.closest?.("div[data-id], div._1AtVbE, div[class*='slAVV4'], article, li") ||
              anchor?.parentElement ||
              anchor;
            return parseDomCard(container);
          })
          .filter(Boolean) as Array<{ title: string; priceText: string; mrpText?: string | null; discountText?: string | null; couponText?: string | null; rating: string | null; image: string | null; url: string | null }>;

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

            const mrpText =
              container?.querySelector?.("div.yRaY8j")?.textContent?.trim?.() ||
              container?.querySelector?.("div._3I9_wc")?.textContent?.trim?.() ||
              contextText.match(/₹\s?[\d,]{2,}/g)?.[1] ||
              null;

              const rating =
              parseRating(container?.querySelector?.("div.XQDdHH")?.textContent) ||
              parseRating(container?.querySelector?.("span.XQDdHH")?.textContent) ||
              parseRating(container?.querySelector?.("div._3LWZlK")?.textContent) ||
              parseRating(container?.querySelector?.("span._3LWZlK")?.textContent) ||
              parseRating(container?.querySelector?.("div._1rcHFq")?.textContent) ||
              parseRating(container?.querySelector?.("[class*='_3LWZlK']")?.textContent) ||
              parseRating(contextText) ||
              null;

            const discountText =
              container?.querySelector?.("div.UkUFwK")?.textContent?.trim?.() ||
              container?.querySelector?.("div._3Ay6Sb span")?.textContent?.trim?.() ||
              contextText.match(/\b\d{1,2}%\s*off\b/i)?.[0] ||
              null;

            const couponText =
              contextText.match(/\b(?:bank offer|coupon|extra\s*₹?\s*[\d,]+\s*off|exchange offer|no cost emi)\b[^\n\r•]*/i)?.[0]?.trim?.() ||
              null;

            const image =
              container?.querySelector?.("img")?.getAttribute?.("src") ||
              container?.querySelector?.("img")?.getAttribute?.("data-src") ||
              null;

            if (!title || !priceText) return null;
            return {
              title,
              priceText,
              mrpText,
              discountText,
              couponText,
              rating,
              image,
              url: href.startsWith("http") ? href : `https://www.flipkart.com${href}`,
            };
          })
          .filter(Boolean) as Array<{ title: string; priceText: string; mrpText?: string | null; discountText?: string | null; couponText?: string | null; rating: string | null; image: string | null; url: string | null }>;

        const jsonLdItems: Array<{ title: string; priceText: string; mrpText?: string | null; discountText?: string | null; couponText?: string | null; rating: string | null; image: string | null; url: string | null }> = [];
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
                const mrpRaw = item?.offers?.highPrice ?? item?.offers?.priceSpecification?.price ?? null;
                const mrpText = mrpRaw != null ? `₹${String(mrpRaw)}` : null;
                const ratingRaw = item?.aggregateRating?.ratingValue ?? item?.reviewRating?.ratingValue ?? null;
                const image = Array.isArray(item?.image) ? item.image[0] : item?.image || null;
                if (!title || !priceText) continue;
                jsonLdItems.push({
                  title: String(title),
                  priceText,
                  mrpText,
                  rating: parseRating(ratingRaw),
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
      }) as Array<{ title: string; priceText: string; mrpText?: string | null; discountText?: string | null; couponText?: string | null; rating: string | null; image: string | null; url: string | null } | null>;

      const validPageItems = pageItems.filter(
        (item): item is { title: string; priceText: string; mrpText?: string | null; discountText?: string | null; couponText?: string | null; rating: string | null; image: string | null; url: string | null } => Boolean(item)
      );

      for (const item of validPageItems) {
        const price = parsePriceToNumber(item.priceText);
        if (!Number.isFinite(price)) continue;
        const parsedMrp = parsePriceToNumber(item.mrpText || null);
        const mrp = Number.isFinite(parsedMrp) && parsedMrp > price ? parsedMrp : null;
        const discountFromText = Number((item.discountText || "").match(/(\d{1,2})\s*%/)?.[1] || Number.NaN);
        const discountFromMrp = mrp ? Math.round(((mrp - price) / mrp) * 100) : Number.NaN;
        const discountPercent = Number.isFinite(discountFromMrp)
          ? discountFromMrp
          : (Number.isFinite(discountFromText) ? discountFromText : null);
        const savingsAmount = mrp && mrp > price ? Number((mrp - price).toFixed(2)) : null;
        const savingsText = savingsAmount
          ? `Save ₹${Math.round(savingsAmount).toLocaleString("en-IN")}`
          : null;
        const couponText = item.couponText || null;
        const offerText = [
          discountPercent ? `${discountPercent}% off` : null,
          couponText,
          savingsText,
        ].filter(Boolean).join(" • ") || null;
        const hasOffer = Boolean(discountPercent || couponText || savingsAmount);
        const cleanedTitle = sanitizeFlipkartTitle(item.title);
        const normalizedImage = item.image?.startsWith("//") ? `https:${item.image}` : item.image;
        collectedItems.push({
          title: cleanedTitle || item.title,
          price,
          priceText: formatPriceInr(price) || item.priceText,
          mrp,
          mrpText: item.mrpText || (mrp ? formatPriceInr(mrp) : null),
          discountPercent,
          savingsAmount,
          savingsText,
          couponText,
          dealType: null,
          offerText,
          hasOffer,
          rating: parseRatingToText(item.rating) || parseRatingToText(item.title),
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

    // Previously we fetched OG images and ratings synchronously here which added
    // substantial latency (HTTP fetches and extra Puppeteer page navigations).
    // Rely on the non-blocking enrichment pass below to fetch missing images/ratings
    // asynchronously so initial response returns quickly.

    // Start a non-blocking enrichment pass for images/ratings to speed up initial response.
    (async () => {
      try {
        const enrichList = deduped.slice(0, 6);
        for (const item of enrichList) {
          try {
            if ((!item.image || item.image.includes('placeholder')) && item.url) {
              const og = await fetchOgImage(item.url as string);
              if (og) item.image = og;
            }
          } catch {}
        }

        for (let i = 0; i < enrichList.length; i++) {
          const it = enrichList[i];
          if (!it.rating && it.url) {
            try {
              const r = await fetchFlipkartRating(it.url as string);
              if (r) it.rating = r;
            } catch {}
            await sleep(80 + Math.floor(Math.random() * 120));
          }
        }
      } catch {}
    })();

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
    try {
      await page.close().catch(() => undefined);
    } catch {}
    if (ownBrowser) await browser.close().catch(() => undefined);
  }
}

async function scrapeMyntra(query: string, limit = 24, sharedBrowser?: any): Promise<StoreScrapeResult> {
  const { default: puppeteer } = await import("puppeteer");
  let browser: any = sharedBrowser;
  let ownBrowser = false;
  if (!browser) {
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    ownBrowser = true;
  }
  const page = await preparePage(browser);

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
    try {
      await page.close().catch(() => undefined);
    } catch {}
    if (ownBrowser) await browser.close().catch(() => undefined);
  }
}

async function scrapeAjio(query: string, limit = 24, sharedBrowser?: any): Promise<StoreScrapeResult> {
  const { default: puppeteer } = await import("puppeteer");
  let browser: any = sharedBrowser;
  let ownBrowser = false;
  if (!browser) {
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    ownBrowser = true;
  }
  const page = await preparePage(browser);

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
    try {
      await page.close().catch(() => undefined);
    } catch {}
    if (ownBrowser) await browser.close().catch(() => undefined);
  }
}

function clampLimit(value: number) {
  return Number.isFinite(value) ? Math.max(1, Math.min(Math.trunc(value), 60)) : 24;
}

async function scrapeProducts(query: string, limit = 24) {
  const browser = await getSharedBrowser();
  const amazonData = await scrapeAmazon(query, limit, browser);
  return { ...amazonData, provider: "amazon", source: "amazon", storesSearched: ["amazon"] };
}

async function scrapeProductsAcrossStores(query: string, limit = 24, stores: StoreKey[] = ["amazon", "flipkart", "myntra", "ajio"]) {
  const selectedStores = stores.length ? stores : ["amazon", "flipkart", "myntra", "ajio"];
  const optimizedQuery = optimizeSearchQuery(query);
  const perStoreTimeoutMs = 30000;

  // Use a shared browser and run scrapers in small batches to reduce cold-launch costs
  const browser = await getSharedBrowser();
  // Increase concurrency slightly to fetch multiple stores faster (careful not to overload)
  const concurrency = Math.min(3, selectedStores.length);
  const results: PromiseSettledResult<StoreScrapeResult>[] = [];

  for (let i = 0; i < selectedStores.length; i += concurrency) {
    const batch = selectedStores.slice(i, i + concurrency).map(async (store) => {
      if (store === "amazon") {
        // Retry Amazon a few times with increasing timeouts to reduce transient failures
        let lastErr: unknown = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const attemptTimeout = perStoreTimeoutMs + attempt * 8000;
            const data = await withTimeout(scrapeAmazon(optimizedQuery, limit, browser), attemptTimeout, `Timeout while scraping ${store}`);
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
            } as StoreScrapeResult;
          } catch (err) {
            lastErr = err;
            await sleep(800 + attempt * 400);
          }
        }
        // All attempts failed — propagate a rejection so caller marks this store failed
        throw lastErr;
      }
      if (store === "flipkart") {
        // Retry Flipkart similarly to make scraping more resilient
        let lastErr: unknown = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const attemptTimeout = 30000 + attempt * 5000;
            return await withTimeout(scrapeFlipkart(optimizedQuery, limit, browser), attemptTimeout, `Timeout while scraping ${store}`);
          } catch (err) {
            lastErr = err;
            await sleep(600 + attempt * 300);
          }
        }
        throw lastErr;
      }
      if (store === "myntra") {
        return withTimeout(scrapeMyntra(optimizedQuery, limit, browser), perStoreTimeoutMs, `Timeout while scraping ${store}`);
      }
      return withTimeout(scrapeAjio(optimizedQuery, limit, browser), perStoreTimeoutMs, `Timeout while scraping ${store}`);
    });

    const settledBatch = await Promise.allSettled(batch);
    results.push(...settledBatch);
  }

  const settled = results;
  const successful = settled
    .filter((entry): entry is PromiseFulfilledResult<StoreScrapeResult> => entry.status === "fulfilled")
    .map((entry) => entry.value);

  let allItems = dedupeProductsPerStore(successful.flatMap((entry) => entry.items));
  let effectiveQuery = optimizedQuery;
  let fallbackUsed = false;

  if (allItems.length === 0) {
    try {
      const directAmazon = await scrapeAmazon(optimizedQuery, Math.max(limit, 24), browser);
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
          scrapeAmazon(relaxedQuery, Math.max(limit, 24), browser),
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

  // Quick best-effort: attempt to fetch OG images for top items with a short timeout
  // so we can provide thumbnails for some products without blocking the whole response.
  (async () => {
    try {
      const topCandidates = allItems.slice(0, 3).filter((it) => it.url && (!it.image || it.image.includes("placeholder")));
      await Promise.all(
        topCandidates.map((it) =>
          Promise.race([
            fetchOgImage(it.url as string),
            new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 1500)),
          ])
            .then((img) => {
              if (img) it.image = img;
            })
            .catch(() => {})
        )
      );
    } catch {}
  })();

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
    // Debug helpers: first few titles returned per store and top ranked titles
    debugStoreSamples: successful.map((entry) => ({
      provider: entry.provider,
      store: entry.store,
      sampleTitles: (entry.items || []).slice(0, 6).map((it) => it.title).filter(Boolean),
    })),
    debugTopRankedTitles: ranked.items.slice(0, 8).map((it) => it.title),
  };
}

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Forward client requests under /api/external/* to backend API at localhost:4000
      '/api/external': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/external/, ''),
      },
    },
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
              expiresAt: now + (hasResults ? 1000 * 60 * 15 : 1000 * 30),
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

            const key = `compare:v2:${query.toLowerCase()}:limit:${limit}:stores:${stores.join("|")}`;
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
              expiresAt: now + (hasResults ? 1000 * 60 * 15 : 1000 * 20),
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

        // Database API: ensure tables and provide simple purchases/watchlist endpoints
        db.ensureTables().catch((e) => console.error('DB init error', e));

        server.middlewares.use("/api/db/purchases", async (req, res) => {
          try {
            if (req.method === 'OPTIONS') {
              res.statusCode = 204; res.end(); return;
            }
            if (req.method === 'POST') {
              let body = '';
              req.on('data', (c) => (body += c));
              await new Promise((r) => req.on('end', r));
              const data = JSON.parse(body || '{}');
              if (!data.title || typeof data.price !== 'number') {
                res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: false, message: 'title and numeric price required' }));
                return;
              }
              const inserted = await db.addPurchase({ title: data.title, price: data.price, url: data.url, store: data.store });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, id: inserted.id }));
              return;
            }
            if (req.method === 'GET') {
              const url = new URL(req.url || '', 'http://localhost');
              const limit = Number(url.searchParams.get('limit') || '50');
              const items = await db.listPurchases(limit);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, items }));
              return;
            }
            res.statusCode = 405; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: false, message: 'Method not allowed' }));
          } catch (err) {
            res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: false, message: err instanceof Error ? err.message : String(err) }));
          }
        });

        server.middlewares.use("/api/db/watchlist", async (req, res) => {
          try {
            if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
            if (req.method === 'POST') {
              let body = '';
              req.on('data', (c) => (body += c));
              await new Promise((r) => req.on('end', r));
              const data = JSON.parse(body || '{}');
              if (!data.title) {
                res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: false, message: 'title required' }));
                return;
              }
              const inserted = await db.addWatch({ title: data.title, url: data.url, store: data.store });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, id: inserted.id }));
              return;
            }
            if (req.method === 'GET') {
              const url = new URL(req.url || '', 'http://localhost');
              const limit = Number(url.searchParams.get('limit') || '50');
              const items = await db.listWatch(limit);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, items }));
              return;
            }
            res.statusCode = 405; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: false, message: 'Method not allowed' }));
          } catch (err) {
            res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: false, message: err instanceof Error ? err.message : String(err) }));
          }
        });

          // Price history API
          server.middlewares.use("/api/db/price-history", async (req, res) => {
            try {
              if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
              if (req.method === 'POST') {
                let body = '';
                req.on('data', (c) => (body += c));
                await new Promise((r) => req.on('end', r));
                const data = JSON.parse(body || '{}');
                if (!data.title) {
                  res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: false, message: 'title required' }));
                  return;
                }
                const inserted = await db.addPriceHistory({ watchlist_id: data.watchlist_id, title: data.title, price: data.price, store: data.store });
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true, id: inserted.id }));
                return;
              }
              if (req.method === 'GET') {
                const url = new URL(req.url || '', 'http://localhost');
                const limit = Number(url.searchParams.get('limit') || '200');
                const watchlistId = url.searchParams.get('watchlistId');
                const items = await db.listPriceHistory(watchlistId ? Number(watchlistId) : undefined, limit);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true, items }));
                return;
              }
              res.statusCode = 405; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: false, message: 'Method not allowed' }));
            } catch (err) {
              res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: false, message: err instanceof Error ? err.message : String(err) }));
            }
          });

          // Alerts API
          server.middlewares.use("/api/db/alerts", async (req, res) => {
            try {
              if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
              if (req.method === 'GET') {
                const url = new URL(req.url || '', 'http://localhost');
                const limit = Number(url.searchParams.get('limit') || '100');
                const items = await db.listAlerts(limit);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true, items }));
                return;
              }
              if (req.method === 'POST') {
                // allow acknowledging alerts by POST { id }
                let body = '';
                req.on('data', (c) => (body += c));
                await new Promise((r) => req.on('end', r));
                const data = JSON.parse(body || '{}');
                if (!data.id) {
                  res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: false, message: 'id required' }));
                  return;
                }
                const ok = await db.ackAlert(Number(data.id));
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok }));
                return;
              }
              res.statusCode = 405; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: false, message: 'Method not allowed' }));
            } catch (err) {
              res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: false, message: err instanceof Error ? err.message : String(err) }));
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
