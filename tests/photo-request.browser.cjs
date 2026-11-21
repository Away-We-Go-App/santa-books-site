// Run with Playwright installed outside the static site. See README.
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { createServer } = require('node:http');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium, webkit } = require('playwright');

const root = path.resolve(__dirname, '../public');
const relay = 'https://abcdefghijklmnopqrst.supabase.co/functions/v1/santa-photo-requests';
let server, origin;
before(async () => {
  server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep)) { res.writeHead(404).end(); return; }
    const types = { '.html': 'text/html', '.mjs': 'text/javascript', '.css': 'text/css',
      '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
    try {
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));

for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
  test(`${engine} sends selected photos and retries only the missing receipt`, async () => {
    const browser = await browserType.launch(engine === 'chromium' && process.env.CHROME_CHANNEL ?
      {channel: process.env.CHROME_CHANNEL} : {});
    try {
      const page = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true });
      const ids = [];
      let closed = false;
      await page.route('**/photos/relay.json', route => route.fulfill({ json: { production: relay } }));
      await page.route(relay + '*', async route => {
        const request = route.request();
        if (request.method() === 'OPTIONS') return route.fulfill({ headers: {
          'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': '*' } });
        if (request.url().endsWith('?action=upload')) {
          assert.equal(request.headers()['content-type'], 'image/jpeg');
          assert.equal(decodeURIComponent(request.headers()['x-sender-name']), 'June');
          ids.push(request.headers()['x-photo-id']);
          return ids.length === 2 ? route.fulfill({ status: 503 }) :
            route.fulfill({ json: { expiresAt: '2026-12-28T12:00:00Z' } });
        }
        return closed ? route.fulfill({ status: 410 }) : route.fulfill({ json: { year: 2025, ownerName: 'Alex' } });
      });
      await page.goto(origin + '/photos/#production/' + 'A'.repeat(43));
      await page.getByRole('button', { name: 'Choose photos', exact: true }).waitFor();
      const sample = await readFile(path.join(root, 'assets/christmas-motion/poster.webp'));
      await page.locator('#files').setInputFiles(['one.webp', 'two.webp'].map(name =>
        ({ name, buffer: sample, mimeType: 'image/webp' })));
      await page.locator('#name').fill('A'.repeat(61));
      await page.locator('#send').click();
      await page.getByText('Use a name or nickname up to 60 characters.').waitFor();
      assert.equal(ids.length, 0);
      await page.locator('#name').fill('June');
      await page.locator('#send').click();
      await page.getByRole('button', { name: 'Retry 1 photo', exact: true }).click();
      await page.locator('#again').waitFor();
      assert.equal(ids.length, 3);
      assert.notEqual(ids[0], ids[1]);
      assert.equal(ids[1], ids[2]);
      assert.match(await page.locator('#status').innerText(), /2 photos are ready for Alex/);
      await page.locator('#again').click();
      assert.equal(await page.locator('#name').inputValue(), 'June');
      closed = true;
      await page.reload();
      await page.getByRole('heading', { name: 'This request is closed' }).waitFor();
      assert.equal(await page.locator('#choose').isVisible(), false);
    } finally { await browser.close(); }
  });
}
