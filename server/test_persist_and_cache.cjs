// Test script: create a search_history row, insert a result, then call scraper endpoint
(async function(){
  try {
    const api = 'http://localhost:4000';
    console.log('Creating search_history...');
    const hResp = await fetch(`${api}/search-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'iphone 15', results_count: 1, metadata: { test: true } }),
    });
    const hJson = await hResp.json();
    console.log('search-history response:', hJson);
    if (!hJson || !hJson.id) throw new Error('failed to create search_history');

    const searchId = hJson.id;
    console.log('Inserting one search_result for id', searchId);
    const rResp = await fetch(`${api}/search-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search_history_id: searchId, results: [ { title: 'iPhone 15 Example', price: 74900, store: 'Amazon', url: 'https://example.com', metadata: {} } ] }),
    });
    const rJson = await rResp.json();
    console.log('search-results response:', rJson);

    console.log('Calling scraper endpoint (vite) to check DB cached response...');
    const scrapeResp = await fetch('http://localhost:8081/api/scrape/compare?q=iphone%2015&limit=24&stores=amazon,flipkart');
    const scrapeJson = await scrapeResp.json();
    console.log('scrape response:', JSON.stringify(scrapeJson, null, 2));
  } catch (e) {
    console.error('Test failed:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
