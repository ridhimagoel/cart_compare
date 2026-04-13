import puppeteer from 'puppeteer';

const query = process.argv[2] || 'iphone 15 pro';
const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}&i=electronics`;

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

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 30000 });

const rows = await page.$$eval('[data-component-type="s-search-result"]', (cards) =>
  cards.slice(0, 12).map((card) => {
    const titleCandidates = [
      card.querySelector('h2 a span')?.textContent,
      card.querySelector('h2 span.a-text-normal')?.textContent,
      card.querySelector("span[data-cy='title-recipe-title']")?.textContent,
      card.querySelector('img.s-image')?.getAttribute('alt'),
      ...Array.from(card.querySelectorAll('a span')).map((el) => el.textContent),
    ]
      .map((t) => t?.trim() || '')
      .filter(Boolean);

    const anchors = Array.from(card.querySelectorAll('a[href]')).map((a) => ({
      href: a.getAttribute('href') || '',
      text: (a.textContent || '').trim().slice(0, 80),
    }));

    const whole = card.querySelector('.a-price .a-price-whole')?.textContent?.replace(/[^\d]/g, '') || null;
    const offscreen = card.querySelector('.a-price .a-offscreen')?.textContent?.trim() || null;

    return {
      titleCandidates,
      anchors,
      whole,
      offscreen,
    };
  })
);

console.log(JSON.stringify({ query, url, count: rows.length, rows }, null, 2));
await browser.close();
