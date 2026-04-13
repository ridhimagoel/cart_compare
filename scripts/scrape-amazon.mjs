import puppeteer from 'puppeteer';

const query = process.argv[2] || 'mobile';
const requestedLimit = Number(process.argv[3] || '24');
const resultLimit = Number.isFinite(requestedLimit)
  ? Math.max(1, Math.min(Math.trunc(requestedLimit), 60))
  : 24;
const queryLooksLikeDevice = /\b(phone|iphone|samsung|pixel|oneplus|mobile|laptop|macbook|tablet)\b/i.test(query);
const effectiveQuery = query;

const searchBaseUrl = `https://www.amazon.in/s?k=${encodeURIComponent(effectiveQuery)}${queryLooksLikeDevice ? '&i=electronics' : ''}`;

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
  );
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-IN,en;q=0.9',
  });

  try {
    const extractPageItems = async () => page.$$eval('[data-component-type="s-search-result"]', (cards) => {
      return cards
        .map((card) => {
          const titleCandidates = [
            card.querySelector('h2 a span')?.textContent,
            card.querySelector('h2 span.a-text-normal')?.textContent,
            card.querySelector("span[data-cy='title-recipe-title']")?.textContent,
            card.querySelector('img.s-image')?.getAttribute('alt'),
            ...Array.from(card.querySelectorAll('a span')).map((el) => el.textContent),
          ]
            .map((t) => t?.trim() || '')
            .filter((t) => t.length > 0);

          const title = titleCandidates.sort((a, b) => b.length - a.length)[0] || null;

          const anchors = Array.from(card.querySelectorAll('a[href]'));
          const linkEl =
            anchors.find((a) => /\/(dp|gp\/product)\//.test(a.getAttribute('href') || '')) ||
            card.querySelector('h2 a') ||
            anchors[0] ||
            null;

          const wholeEl = card.querySelector('.a-price .a-price-whole');
          const fracEl = card.querySelector('.a-price .a-price-fraction');
          const offscreenPriceEl = card.querySelector('.a-price .a-offscreen');
          const imageEl = card.querySelector('img.s-image');
          const ratingEl = card.querySelector('span.a-icon-alt');

          const rawLink = linkEl?.getAttribute('href') || null;
          const offscreenPrice = offscreenPriceEl?.textContent?.trim() || null;
          const whole = wholeEl?.textContent?.replace(/[^\d]/g, '') || '';
          const fraction = fracEl?.textContent?.replace(/[^\d]/g, '') || '00';
          const image = imageEl?.getAttribute('src') || null;
          const rating = ratingEl?.textContent?.trim() || null;

          let price = Number.NaN;
          let priceText = null;

          if (offscreenPrice) {
            const numeric = offscreenPrice.replace(/[^\d.]/g, '');
            price = Number(numeric);
            priceText = offscreenPrice;
          } else if (whole) {
            price = Number(`${whole}.${fraction}`);
            priceText = `₹${Number(whole).toLocaleString('en-IN')}`;
          }

          if (!title || !Number.isFinite(price)) return null;

          const url = rawLink
            ? rawLink.startsWith('http')
              ? rawLink
              : `https://www.amazon.in${rawLink}`
            : null;

          if (url && (url.includes('/sspa/') || url.includes('slredirect'))) return null;

          return {
            title,
            price,
            priceText,
            rating,
            image,
            url,
          };
        })
        .filter(Boolean);
    });

    const maxPages = queryLooksLikeDevice ? 3 : 2;
    const collectedRawItems = [];

    for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
      const pageUrl = `${searchBaseUrl}&page=${pageNo}`;
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      if (pageNo === 1) {
        const bodyText = await page.$eval('body', (el) => el.textContent || '');
        if (/captcha|enter the characters you see below/i.test(bodyText)) {
          console.log(JSON.stringify({
            ok: false,
            blocked: true,
            message: 'Amazon showed CAPTCHA. Try again later or run headed browser for manual check.',
            url: searchBaseUrl,
          }, null, 2));
          return;
        }
      }

      const hasResults = await page
        .waitForSelector('[data-component-type="s-search-result"]', { timeout: 25000 })
        .then(() => true)
        .catch(() => false);

      if (!hasResults) {
        if (pageNo === 1) {
          console.log(JSON.stringify({
            ok: true,
            store: 'Amazon India',
            query,
            limit: resultLimit,
            count: 0,
            items: [],
          }, null, 2));
          return;
        }
        break;
      }

      const pageItems = await extractPageItems();
      if (!pageItems.length && pageNo > 1) break;

      collectedRawItems.push(...pageItems);
      if (collectedRawItems.length >= 180) break;
    }

    const rawProducts = collectedRawItems.filter((item, index, arr) => {
      const key = item.url || `${item.title}:${item.price}`;
      return arr.findIndex((x) => (x.url || `${x.title}:${x.price}`) === key) === index;
    });

    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);

    const normalize = (text) => text
      .toLowerCase()
      .replace(/([a-z])(\d)/g, '$1 $2')
      .replace(/(\d)([a-z])/g, '$1 $2')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const stopWords = new Set([
      'the',
      'and',
      'for',
      'with',
      'from',
      'inch',
      'cm',
      'new',
      'latest',
      'model',
    ]);

    const accessoryWords = new Set([
      'case',
      'cases',
      'cover',
      'covers',
      'tempered',
      'protector',
      'screen',
      'charger',
      'charging',
      'cable',
      'adapter',
      'skin',
      'back',
      'guard',
      'battery',
      'earbuds',
      'headphones',
      'magsafe',
      'silicone',
      'bumper',
      'holder',
      'stand',
      'wallet',
      'lens',
    ]);

    const queryAccessoryIntent = query
      .toLowerCase()
      .split(/\s+/)
      .some((t) => accessoryWords.has(t));

    const qualifierWords = new Set([
      'pro',
      'max',
      'plus',
      'ultra',
      'mini',
      'se',
      'fe',
      'air',
      'note',
      'nord',
    ]);
    const unitWords = new Set(['cm', 'mm', 'inch', 'inches', 'hz', 'mah', 'mp', 'nm']);

    const matchesToken = (title, token) => {
      const words = title.split(' ').filter(Boolean);
      if (/^\d+$/.test(token)) {
        return words.some((w, i) => {
          if (w !== token) return false;
          const next = words[i + 1] || '';
          const afterNext = words[i + 2] || '';
          const looksLikeDecimalDimension = /^\d+$/.test(next) && unitWords.has(afterNext);
          return !looksLikeDecimalDimension;
        });
      }
      return title.includes(token);
    };

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const normalizedQuery = normalize(query);
    const mustTokens = tokens.filter((t) => /^\d+$/.test(t) || (t.length > 2 && !stopWords.has(t)));
    const numberTokens = mustTokens.filter((t) => /^\d+$/.test(t));
    const textTokens = mustTokens.filter((t) => !/^\d+$/.test(t));
    const queryQualifierTokens = textTokens.filter((t) => qualifierWords.has(t));
    const minimumTokenHits = Math.max(
      1,
      Math.floor(mustTokens.length * (queryLooksLikeDevice && !queryAccessoryIntent ? 0.67 : 0.5))
    );
    const brandMatchers = [
      { query: /\b(iphone|apple)\b/, title: /\b(iphone|apple)\b/ },
      { query: /\b(samsung|galaxy)\b/, title: /\b(samsung|galaxy)\b/ },
      { query: /\b(oneplus)\b/, title: /\b(oneplus)\b/ },
      { query: /\b(oppo)\b/, title: /\b(oppo)\b/ },
      { query: /\b(vivo|iqoo)\b/, title: /\b(vivo|iqoo)\b/ },
      { query: /\b(xiaomi|redmi|mi)\b/, title: /\b(xiaomi|redmi|mi)\b/ },
      { query: /\b(pixel|google)\b/, title: /\b(pixel|google)\b/ },
    ];
    const brandRule = brandMatchers.find((b) => b.query.test(normalizedQuery)) || null;
    const primaryToken = textTokens[0] || null;
    const compatibilityRegex = /\b(for|compatible with|designed for|fits|fit for|works with)\b/;
    const accessoryRegex = /\b(case|cases|cover|covers|tempered|protector|charger|charging|cable|adapter|skin|guard|battery|earbuds|headphones|back cover|screen guard|camera lens|stand|holder|wallet|magsafe|silicone|bumper|lens)\b/;
    const exactPhraseRegex = mustTokens.length
      ? new RegExp(mustTokens.map((t) => escapeRegex(t)).join('\\s*[- ]?\\s*'))
      : null;

    let ranked = rawProducts
      .map((item) => {
        const title = normalize(item.title);
        const titleTokens = new Set(title.split(' ').filter(Boolean));
        const mustMatches = mustTokens.filter((t) => matchesToken(title, t)).length;
        const allNumberTokensMatched = numberTokens.every((t) => matchesToken(title, t));
        const exactIncludes = normalizedQuery.length > 0 && title.includes(normalizedQuery);
        const exactPhraseMatch = exactPhraseRegex ? exactPhraseRegex.test(title) : false;
        const coverage = mustTokens.length ? mustMatches / mustTokens.length : 1;
        const hasAccessoryWord = [...accessoryWords].some((w) => titleTokens.has(w)) || accessoryRegex.test(title);
        const hasCompatibilityPhrase = compatibilityRegex.test(title);
        const isAccessoryLike = hasAccessoryWord || hasCompatibilityPhrase;
        const startsWithCompatibility = primaryToken
          ? new RegExp(`^\\s*(for|compatible with|designed for)\\s+${escapeRegex(primaryToken)}\\b`).test(title)
          : false;
        const tokenHits = mustMatches;
        const hasEnoughTokenHits = tokenHits >= minimumTokenHits;
        const hasAllQualifiers = queryQualifierTokens.every((t) => matchesToken(title, t));
        const isModelSpecificQuery = queryQualifierTokens.length > 0 || numberTokens.length > 0;
        const matchesBrand = brandRule ? brandRule.title.test(title) : true;
        const score =
          (exactIncludes ? 120 : 0) +
          (exactPhraseMatch ? 40 : 0) +
          (matchesBrand ? 30 : -80) +
          (hasAllQualifiers ? 25 : -40) +
          (allNumberTokensMatched ? 30 : 0) +
          Math.round(coverage * 50) -
          (isAccessoryLike ? 120 : 0) -
          (startsWithCompatibility ? 40 : 0);

        return {
          ...item,
          _score: score,
          _coverage: coverage,
          _allNumberTokensMatched: allNumberTokensMatched,
          _hasAccessoryWord: hasAccessoryWord,
          _hasCompatibilityPhrase: hasCompatibilityPhrase,
          _isAccessoryLike: isAccessoryLike,
          _hasEnoughTokenHits: hasEnoughTokenHits,
          _hasAllQualifiers: hasAllQualifiers,
          _isModelSpecificQuery: isModelSpecificQuery,
          _matchesBrand: matchesBrand,
          _startsWithCompatibility: startsWithCompatibility,
          _exactPhraseMatch: exactPhraseMatch,
          _tokenHits: tokenHits,
        };
      })
      .filter((item) => {
        if (!mustTokens.length) return true;
        if (numberTokens.length > 0 && !item._allNumberTokensMatched) return false;
        if (queryLooksLikeDevice && !queryAccessoryIntent && item._isAccessoryLike) return false;
        if (queryLooksLikeDevice && !queryAccessoryIntent && !item._hasEnoughTokenHits) return false;
        if (queryLooksLikeDevice && !queryAccessoryIntent && !item._matchesBrand) return false;
        if (queryLooksLikeDevice && primaryToken && !matchesToken(normalize(item.title), primaryToken)) return false;
        if (item._score >= 100) return true;
        return item._coverage >= 0.67;
      })
      .sort((a, b) => b._score - a._score);

    if (ranked.length === 0 && queryLooksLikeDevice && !queryAccessoryIntent) {
      ranked = rawProducts
        .map((item) => {
          const title = normalize(item.title);
          const titleTokens = new Set(title.split(' ').filter(Boolean));
          const tokenHits = mustTokens.filter((t) => matchesToken(title, t)).length;
          const allNumberTokensMatched = numberTokens.every((t) => matchesToken(title, t));
          const hasAccessoryWord = [...accessoryWords].some((w) => titleTokens.has(w)) || accessoryRegex.test(title);
          const hasCompatibilityPhrase = compatibilityRegex.test(title);
          const isAccessoryLike = hasAccessoryWord || hasCompatibilityPhrase;
          const coverage = mustTokens.length ? tokenHits / mustTokens.length : 1;

          return {
            ...item,
            _score: tokenHits * 30 + (allNumberTokensMatched ? 20 : 0),
            _coverage: coverage,
            _allNumberTokensMatched: allNumberTokensMatched,
            _hasAccessoryWord: hasAccessoryWord,
            _hasCompatibilityPhrase: hasCompatibilityPhrase,
            _isAccessoryLike: isAccessoryLike,
            _hasEnoughTokenHits: tokenHits >= minimumTokenHits,
            _hasAllQualifiers: queryQualifierTokens.every((t) => matchesToken(title, t)),
            _isModelSpecificQuery: queryQualifierTokens.length > 0 || numberTokens.length > 0,
            _matchesBrand: brandRule ? brandRule.title.test(title) : true,
            _startsWithCompatibility: false,
            _exactPhraseMatch: false,
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
      .slice(0, resultLimit);

    const relatedRanked = dedupedRanked
      .filter((item) => {
        const inExact = exactRanked.some((x) => (x.url || x.title) === (item.url || item.title));
        if (inExact) return false;
        if (queryLooksLikeDevice && !queryAccessoryIntent && item._isAccessoryLike) return false;
        return item._score >= 40 || item._coverage >= 0.5;
      })
      .slice(0, resultLimit);

    const stripMeta = ({ _score, _coverage, _allNumberTokensMatched, _hasAccessoryWord, _hasCompatibilityPhrase, _isAccessoryLike, _hasEnoughTokenHits, _hasAllQualifiers, _isModelSpecificQuery, _matchesBrand, _startsWithCompatibility, _exactPhraseMatch, _tokenHits, ...item }) => item;

    const exactItems = exactRanked.map(stripMeta);
    const relatedItems = relatedRanked.map(stripMeta);
    const products = (exactItems.length > 0 ? exactItems : relatedItems).slice(0, resultLimit);

    console.log(JSON.stringify({
      ok: true,
      store: 'Amazon India',
      query,
      effectiveQuery,
      limit: resultLimit,
      exactCount: exactItems.length,
      relatedCount: relatedItems.length,
      exactItems,
      relatedItems,
      count: products.length,
      items: products,
    }, null, 2));
  } catch (error) {
    console.log(JSON.stringify({
      ok: false,
      blocked: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      url: searchBaseUrl,
    }, null, 2));
  } finally {
    await browser.close();
  }
}

run();
