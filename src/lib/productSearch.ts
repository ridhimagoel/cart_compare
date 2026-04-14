export interface ProductItem {
  title: string;
  price: number;
  priceText: string;
  mrp?: number | null;
  mrpText?: string | null;
  discountPercent?: number | null;
  savingsAmount?: number | null;
  savingsText?: string | null;
  couponText?: string | null;
  dealType?: string | null;
  offerText?: string | null;
  hasOffer?: boolean;
  rating: string | null;
  image: string | null;
  url: string | null;
  store?: string | null;
  source?: string | null;
}

export interface RankedProductItem extends ProductItem {
  _score: number;
  _coverage: number;
  _allNumberTokensMatched: boolean;
  _hasPrimaryNumberExact: boolean;
  _isAccessoryLike: boolean;
  _hasEnoughTokenHits: boolean;
  _hasAllQualifiers: boolean;
  _isModelSpecificQuery: boolean;
  _matchesBrand: boolean;
  _tokenHits: number;
}

export interface RankedSearchResult {
  effectiveQuery: string;
  items: ProductItem[];
  exactItems: ProductItem[];
  relatedItems: ProductItem[];
}

const DEFAULT_STOP_WORDS = new Set([
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

const DEFAULT_ACCESSORY_WORDS = new Set([
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

const DEFAULT_QUALIFIER_WORDS = new Set([
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

const DEFAULT_UNIT_WORDS = new Set(["cm", "mm", "inch", "inches", "hz", "mah", "mp", "nm"]);

const DEFAULT_COMPATIBILITY_REGEX = /\b(for|compatible with|designed for|fits|fit for|works with)\b/;
const DEFAULT_ACCESSORY_REGEX = /\b(case|cover|tempered|protector|screen guard|screen protector|glass|charger|cable|adapter|skin|back cover|camera lens|magsafe|wallet|stand|holder|bumper)\b/;

const DEFAULT_BRAND_MATCHERS: Array<{ query: RegExp; title: RegExp }> = [
  { query: /\b(iphone|apple)\b/, title: /\b(iphone|apple)\b/ },
  { query: /\b(samsung|galaxy)\b/, title: /\b(samsung|galaxy)\b/ },
  { query: /\b(oneplus)\b/, title: /\b(oneplus)\b/ },
  { query: /\b(oppo)\b/, title: /\b(oppo)\b/ },
  { query: /\b(vivo|iqoo)\b/, title: /\b(vivo|iqoo)\b/ },
  { query: /\b(xiaomi|redmi|mi)\b/, title: /\b(xiaomi|redmi|mi)\b/ },
  { query: /\b(pixel|google)\b/, title: /\b(pixel|google)\b/ },
];

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesToken(title: string, token: string, unitWords = DEFAULT_UNIT_WORDS) {
  const words = title.split(" ").filter(Boolean);

  if (/^\d+$/.test(token)) {
    if (token.length <= 2) {
      return words.some((word, index) => {
        if (!/^\d+$/.test(word)) return false;
        const next = words[index + 1] || "";
        const afterNext = words[index + 2] || "";
        const looksLikeDecimalDimension = /^\d+$/.test(next) && unitWords.has(afterNext);
        if (looksLikeDecimalDimension) return false;
        return word.startsWith(token);
      });
    }

    return words.some((word, index) => {
      if (word !== token) return false;
      const next = words[index + 1] || "";
      const afterNext = words[index + 2] || "";
      const looksLikeDecimalDimension = /^\d+$/.test(next) && unitWords.has(afterNext);
      return !looksLikeDecimalDimension;
    });
  }

  return title.includes(token);
}

function hasExactNumberToken(title: string, token: string, unitWords = DEFAULT_UNIT_WORDS) {
  const words = title.split(" ").filter(Boolean);
  return words.some((word, index) => {
    if (word !== token) return false;
    const next = words[index + 1] || "";
    const afterNext = words[index + 2] || "";
    const looksLikeDecimalDimension = /^\d+$/.test(next) && unitWords.has(afterNext);
    return !looksLikeDecimalDimension;
  });
}

function detectQueryIntent(query: string, accessoryWords = DEFAULT_ACCESSORY_WORDS) {
  const queryTokens = tokenize(query);
  const queryLooksLikeDevice = /\b(phone|iphone|ipone|iphon|samsung|pixel|oneplus|mobile|laptop|macbook|tablet|watch|tv|earbuds|headphones|camera|monitor)\b/i.test(
    query
  );
  const queryAccessoryIntent = queryTokens.some((token) => accessoryWords.has(token));

  return { queryLooksLikeDevice, queryAccessoryIntent };
}

function inferBrandRule(normalizedQuery: string, brandMatchers = DEFAULT_BRAND_MATCHERS) {
  return brandMatchers.find((candidate) => candidate.query.test(normalizedQuery)) || null;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreAndRankItems(
  query: string,
  items: ProductItem[],
  options?: {
    stopWords?: Set<string>;
    accessoryWords?: Set<string>;
    qualifierWords?: Set<string>;
    brandMatchers?: Array<{ query: RegExp; title: RegExp }>;
    compatibilityRegex?: RegExp;
    maxResults?: number;
  }
): RankedSearchResult {
  const stopWords = options?.stopWords ?? DEFAULT_STOP_WORDS;
  const accessoryWords = options?.accessoryWords ?? DEFAULT_ACCESSORY_WORDS;
  const qualifierWords = options?.qualifierWords ?? DEFAULT_QUALIFIER_WORDS;
  const brandMatchers = options?.brandMatchers ?? DEFAULT_BRAND_MATCHERS;
  const compatibilityRegex = options?.compatibilityRegex ?? DEFAULT_COMPATIBILITY_REGEX;
  const accessoryRegex = DEFAULT_ACCESSORY_REGEX;
  const maxResults = options?.maxResults ?? 24;

  const normalizedQuery = normalizeText(query);
  const { queryLooksLikeDevice, queryAccessoryIntent } = detectQueryIntent(query, accessoryWords);
  const mustTokens = tokenize(query).filter((token) => /^\d+$/.test(token) || (token.length > 2 && !stopWords.has(token)));
  const numberTokens = mustTokens.filter((token) => /^\d+$/.test(token));
  const textTokens = mustTokens.filter((token) => !/^\d+$/.test(token));
  const queryQualifierTokens = textTokens.filter((token) => qualifierWords.has(token));
  const primaryNumberToken = numberTokens[0] || null;
  const shouldPreferExactPrimaryNumber = Boolean(primaryNumberToken && primaryNumberToken.length >= 2);
  const queryPhraseRegex = mustTokens.length
    ? new RegExp(`\\b${mustTokens.map((token) => escapeRegex(token)).join("\\s+")}\\b`)
    : null;
  const minimumTokenHits = Math.max(
    1,
    Math.floor(mustTokens.length * (queryLooksLikeDevice && !queryAccessoryIntent ? 0.67 : 0.5))
  );
  const brandRule = inferBrandRule(normalizedQuery, brandMatchers);

  const ranked = items
    .map((item) => {
      const title = normalizeText(item.title);
      const titleTokens = new Set(title.split(" ").filter(Boolean));
      const mustMatches = mustTokens.filter((token) => matchesToken(title, token)).length;
      const allNumberTokensMatched = numberTokens.every((token) => matchesToken(title, token));
      const hasPrimaryNumberExact =
        primaryNumberToken && shouldPreferExactPrimaryNumber
          ? hasExactNumberToken(title, primaryNumberToken)
          : true;
      const hasExactPhrase = queryPhraseRegex ? queryPhraseRegex.test(title) : false;
      const exactIncludes = normalizedQuery.length > 0 && title.includes(normalizedQuery);
      const coverage = mustTokens.length ? mustMatches / mustTokens.length : 1;
      const hasAccessoryWord = [...accessoryWords].some((word) => titleTokens.has(word));
      const hasCompatibilityPhrase = compatibilityRegex.test(title);
      const hasAccessoryRegex = accessoryRegex.test(title);
      const isAccessoryLike = hasAccessoryWord || hasCompatibilityPhrase || hasAccessoryRegex;
      const hasEnoughTokenHits = mustMatches >= minimumTokenHits;
      const hasAllQualifiers = queryQualifierTokens.every((token) => matchesToken(title, token));
      const titleQualifierTokens = [...qualifierWords].filter((token) => matchesToken(title, token));
      const hasUnexpectedQualifier =
        queryQualifierTokens.length === 0 &&
        titleQualifierTokens.length > 0 &&
        queryLooksLikeDevice &&
        !queryAccessoryIntent;
      const isModelSpecificQuery = queryQualifierTokens.length > 0 || numberTokens.length > 0;
      const matchesBrand = brandRule ? brandRule.title.test(title) : true;
      const score =
        (hasExactPhrase ? 170 : 0) +
        (exactIncludes ? 120 : 0) +
        (matchesBrand ? 30 : -80) +
        (hasAllQualifiers ? 25 : -40) +
        (allNumberTokensMatched ? 30 : 0) +
        (hasPrimaryNumberExact ? 80 : shouldPreferExactPrimaryNumber ? -45 : 0) +
        (hasUnexpectedQualifier ? -28 : 0) +
        Math.round(coverage * 50) -
        (isAccessoryLike ? 120 : 0);

      return {
        ...item,
        _score: score,
        _coverage: coverage,
        _allNumberTokensMatched: allNumberTokensMatched,
        _hasPrimaryNumberExact: hasPrimaryNumberExact,
        _isAccessoryLike: isAccessoryLike,
        _hasEnoughTokenHits: hasEnoughTokenHits,
        _hasAllQualifiers: hasAllQualifiers,
        _isModelSpecificQuery: isModelSpecificQuery,
        _matchesBrand: matchesBrand,
        _tokenHits: mustMatches,
      } satisfies RankedProductItem;
    })
    .filter((item) => {
      if (!mustTokens.length) return true;
      if (numberTokens.length > 0 && !item._allNumberTokensMatched) return false;
      if (shouldPreferExactPrimaryNumber && !item._hasPrimaryNumberExact && queryLooksLikeDevice && !queryAccessoryIntent) {
        return item._coverage >= 0.8;
      }
      if (queryLooksLikeDevice && !queryAccessoryIntent && item._isAccessoryLike) return false;
      if (queryLooksLikeDevice && !queryAccessoryIntent && !item._hasEnoughTokenHits) return false;
      if (queryLooksLikeDevice && !queryAccessoryIntent && !item._matchesBrand) return false;
      if (item._score >= 100) return true;
      return item._coverage >= 0.67;
    })
    .sort((a, b) => b._score - a._score);

  const dedupedRanked = ranked.filter((item, index, arr) => {
    const key = item.url || `${item.title}:${item.price}`;
    return arr.findIndex((candidate) => (candidate.url || `${candidate.title}:${candidate.price}`) === key) === index;
  });

  const exactRanked = dedupedRanked.filter((item) => {
    const normalizedTitle = normalizeText(item.title);
    const includesExactPhrase = normalizedQuery.length > 0 && normalizedTitle.includes(normalizedQuery);
    const titleQualifierTokens = [...qualifierWords].filter((token) => matchesToken(normalizedTitle, token));
    const hasUnexpectedQualifier = queryQualifierTokens.length === 0 && titleQualifierTokens.length > 0;

    if (queryLooksLikeDevice && !queryAccessoryIntent) {
      if (includesExactPhrase && item._matchesBrand && !item._isAccessoryLike && !hasUnexpectedQualifier) return true;
      return (
        item._matchesBrand &&
        item._allNumberTokensMatched &&
        item._hasAllQualifiers &&
        !item._isAccessoryLike &&
        !hasUnexpectedQualifier &&
        (!shouldPreferExactPrimaryNumber || item._hasPrimaryNumberExact)
      );
    }

    return item._score >= 120 || item._coverage >= 0.85;
  });

  const relatedRanked = dedupedRanked.filter((item) => {
    const inExact = exactRanked.some((candidate) => (candidate.url || candidate.title) === (item.url || item.title));
    if (inExact) return false;
    if (queryLooksLikeDevice && !queryAccessoryIntent && item._isAccessoryLike) return false;
    return item._score >= 40 || item._coverage >= 0.5;
  });

  const stripMeta = ({
    _score,
    _coverage,
    _allNumberTokensMatched,
    _hasPrimaryNumberExact,
    _isAccessoryLike,
    _hasEnoughTokenHits,
    _hasAllQualifiers,
    _isModelSpecificQuery,
    _matchesBrand,
    _tokenHits,
    ...item
  }: RankedProductItem) => item;

  const exactItems = exactRanked.map(stripMeta).slice(0, maxResults);
  const relatedItems = relatedRanked.map(stripMeta).slice(0, maxResults);
  const itemsToReturn = (exactItems.length > 0 ? exactItems : relatedItems).slice(0, maxResults);

  return {
    effectiveQuery: query,
    exactItems,
    relatedItems,
    items: itemsToReturn,
  };
}

export function rankProducts(
  query: string,
  items: ProductItem[],
  options?: {
    stopWords?: Set<string>;
    accessoryWords?: Set<string>;
    qualifierWords?: Set<string>;
    brandMatchers?: Array<{ query: RegExp; title: RegExp }>;
    compatibilityRegex?: RegExp;
    maxResults?: number;
  }
) {
  return scoreAndRankItems(query, items, options);
}

export function dedupeProducts(items: ProductItem[]) {
  return items.filter((item, index, arr) => {
    const key = item.url || `${item.title}:${item.price}`;
    return arr.findIndex((candidate) => (candidate.url || `${candidate.title}:${candidate.price}`) === key) === index;
  });
}
