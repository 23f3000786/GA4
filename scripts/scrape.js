const { chromium } = require('playwright');

// Seeds to visit
const seeds = [60,61,62,63,64,65,66,67,68,69];
// Provide a base URL via env var BASE_URL or default to an example pattern.
// Replace the default with the real target before pushing to GitHub.
const base = process.env.BASE_URL || 'https://sanand0.github.io/tdsdata/js_table/?seed=60';

function extractNumbersFromText(text) {
  // match numbers, including optional commas and decimals, optionally negative
  const regex = /-?\d{1,3}(?:[\d,]*)(?:\.\d+)?/g;
  const matches = text.match(regex) || [];
  const nums = matches.map(s => {
    // remove commas used as thousands separators
    const cleaned = s.replace(/,/g, '');
    const v = parseFloat(cleaned);
    return isNaN(v) ? 0 : v;
  });
  return nums;
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();

  let grandTotal = 0;
  for (const seed of seeds) {
    const url = `${base}${seed}`;
    try {
      console.log(`Visiting: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      // collect all table text content
      const tablesText = await page.$$eval('table', tables => tables.map(t => t.innerText));
      if (tablesText.length === 0) {
        // fallback: check any numeric content on page
        const bodyText = await page.$eval('body', b => b.innerText).catch(() => '');
        const nums = extractNumbersFromText(bodyText);
        const sum = nums.reduce((a,b) => a+b, 0);
        console.log(`Seed ${seed}: found ${nums.length} numbers, sum=${sum}`);
        grandTotal += sum;
      } else {
        let pageSum = 0;
        for (const t of tablesText) {
          const nums = extractNumbersFromText(t);
          const sum = nums.reduce((a,b) => a+b, 0);
          pageSum += sum;
        }
        console.log(`Seed ${seed}: ${tablesText.length} tables, page sum=${pageSum}`);
        grandTotal += pageSum;
      }
    } catch (err) {
      console.error(`Error visiting ${url}:`, err.message || err);
    }
  }

  await browser.close();

  // Print final total in an easy-to-find form for Action logs
  console.log('TOTAL_SUM:', grandTotal);
  // Also print JSON for machine parsing
  console.log(JSON.stringify({ total: grandTotal }));

  process.exit(0);
})();
