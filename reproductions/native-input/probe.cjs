const path = require('node:path');
const fs = require('node:fs');
const { build } = require('esbuild');
const { chromium } = require('@playwright/test');
const root = process.cwd();
(async () => {
  const result = await build({
    stdin: {
      resolveDir: root,
      loader: 'tsx',
      contents: fs.readFileSync(path.join(__dirname, 'fixture.tsx'), 'utf8'),
    },
    alias: process.env.JOTAI_X_BUNDLE
      ? {
          'jotai-x': path.resolve(process.env.JOTAI_X_BUNDLE),
          jotai: path.join(
            path.dirname(require.resolve('jotai/package.json')),
            'dist'
          ),
          react: path.dirname(require.resolve('react/package.json')),
          'react-dom': path.dirname(require.resolve('react-dom/package.json')),
        }
      : undefined,
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('http://repro.test/**', (r) =>
      r.fulfill({ contentType: 'text/html', body: '<div id="root"></div>' })
    );
    await page.goto('http://repro.test/');
    await page.addScriptTag({ content: result.outputFiles[0].text });
    await page.locator('input').click();
    const cdp = await context.newCDPSession(page);
    const expected = 'abcdefghij'.repeat(120);
    await Promise.all(
      Array.from(expected, (text) => cdp.send('Input.insertText', { text }))
    );
    await page.waitForTimeout(100);
    const actual = await page.locator('input').inputValue();
    const mirrored = await page.locator('output').textContent();
    console.log(
      JSON.stringify(
        {
          bundle: process.env.JOTAI_X_BUNDLE || 'published jotai-x 2.3.4',
          react: require('react/package.json').version,
          jotai: require('jotai/package.json').version,
          expectedCharacters: expected.length,
          inputMatches: actual === expected,
          mirrorMatches: mirrored === expected,
          errorCount: errors.length,
          firstError: errors[0],
        },
        null,
        2
      )
    );
    if (actual !== expected || mirrored !== expected || errors.length)
      process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
