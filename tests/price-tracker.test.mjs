import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { collectPrices, dataPath, extractOffers, fetchPublicHtml, isPublicAddress, parsePrice, renderPriceMarkdown, resolvePublicAddresses, validatePublicUrl, validateSources, writeReport } from '../tools/price-tracker.mjs';

const URL = 'https://payforgpt.com/';
const WHEN = '2026-10-19T00:00:00.000Z';
function fakeTransport(responses, seen = []) {
  return (url, options, callback) => {
    seen.push({ url: url.href, options }); const req = new EventEmitter();
    req.destroy = (error) => queueMicrotask(() => req.emit('error', error));
    req.end = () => queueMicrotask(() => {
      const response = responses.shift(); const res = new PassThrough();
      res.statusCode = response.status ?? 200; res.headers = { 'content-type': 'text/html', ...response.headers };
      callback(res); if (!res.destroyed) res.end(response.body ?? '<h1>Public page</h1>');
    });
    return req;
  };
}
test('allows approved public HTTPS pages; rejects SSRF, credentials, APIs, queries and nonstandard ports', () => {
  assert.equal(validatePublicUrl(URL).hostname, 'payforgpt.com');
  for (const url of ['http://payforgpt.com/', 'https://evil.example/', 'https://payforgpt.com.evil.example/', 'https://127.0.0.1/', 'https://user:pass@payforgpt.com/', 'https://payforgpt.com:444/', 'https://payforgpt.com/api/orders', 'https://payforgpt.com/%61pi/orders', 'https://payforgpt.com/checkout/test', 'https://payforgpt.com/?token=test', 'https://payforgpt.com/#x']) assert.throws(() => validatePublicUrl(url));
});
test('rejects private, metadata, documentation and transition DNS addresses, including mixed DNS answers', async () => {
  for (const address of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '192.0.2.1', '198.18.0.1', '198.51.100.5', '203.0.113.1', '224.0.0.1', '::1', 'fe80::1', 'fc00::1', '::ffff:127.0.0.1', '2001:db8::1', '2002:0a00:1::']) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress('1.1.1.1'), true); assert.equal(isPublicAddress('2606:4700::1111'), true);
  await assert.rejects(resolvePublicAddresses('payforgpt.com', async () => [{ address: '1.1.1.1', family: 4 }, { address: '10.0.0.1', family: 4 }]), /NON_PUBLIC_DNS_ADDRESS/);
});
test('fetch binds request DNS to verified public answers and refuses redirect to forbidden hosts', async () => {
  const seen = []; const lookup = async () => [{ address: '1.1.1.1', family: 4 }];
  const result = await fetchPublicHtml(URL, { lookup, request: fakeTransport([{ body: '<h1>OK</h1>' }], seen) });
  assert.equal(result.status, 200); assert.equal(result.bytes, 11);
  const pinned = await new Promise((resolve, reject) => seen[0].options.lookup('payforgpt.com', { all: true }, (error, values) => error ? reject(error) : resolve(values)));
  assert.deepEqual(pinned, [{ address: '1.1.1.1', family: 4 }]);
  const redirects = [];
  await assert.rejects(fetchPublicHtml(URL, { lookup, request: fakeTransport([{ status: 302, headers: { location: 'https://127.0.0.1/' } }], redirects) }), /HOST_NOT_ALLOWED/);
  assert.equal(redirects.length, 1);
});
test('fetch enforces response size, DNS deadline and error status without parsing error pages', async () => {
  const lookup = async () => [{ address: '1.1.1.1', family: 4 }];
  await assert.rejects(fetchPublicHtml(URL, { lookup, maxBytes: 10, request: fakeTransport([{ body: 'x'.repeat(11) }]) }), /RESPONSE_TOO_LARGE/);
  await assert.rejects(fetchPublicHtml(URL, { lookup, request: fakeTransport([{ status: 403, body: '<h1>Bot challenge $99</h1>' }]) }), /HTTP_403/);
  await assert.rejects(fetchPublicHtml(URL, { timeoutMs: 5, lookup: async () => new Promise(() => {}) }), /REQUEST_TIMEOUT/);
});
test('price parser preserves zero and rejects ranges, negatives, missing and malformed values', () => {
  assert.equal(parsePrice(0), 0); assert.equal(parsePrice('0.00'), 0); assert.equal(parsePrice('1,600.00'), 1600);
  for (const price of [null, undefined, '', '-2', '10-20', '￥168', '1,60', NaN, Infinity, -1]) assert.equal(parsePrice(price), null);
});
test('structured Product/Service/Offer binding excludes unrelated FAQ prices and preserves unknowns', () => {
  const html = `<script type="application/ld+json">${JSON.stringify({ '@graph': [{ '@type': 'Service', name: 'ChatGPT Plus 月卡', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY', url: '/product/7' } }, { '@type': 'Offer', name: 'Pro 20x', price: '1600', priceCurrency: 'CNY' }, { '@type': 'FAQPage', text: 'Plus $20, Pro $200' }] })}</script>`;
  const result = extractOffers(html, URL, WHEN); assert.equal(result.offers.length, 2);
  const plus = result.offers[0]; assert.equal(plus.price, 0); assert.equal(plus.currency, 'CNY'); assert.equal(plus.billingPeriod.unit, 'month'); assert.equal(plus.accountType, 'unknown'); assert.equal(plus.invoiceSupport.value, 'unknown'); assert.equal(plus.taxStatus.value, 'unknown'); assert.equal(plus.simSupport.observedAt, WHEN); assert.equal(plus.productUrl, 'https://payforgpt.com/product/7');
  assert.equal(result.offers[1].billingPeriod.unit, 'unknown'); assert.equal(plus.comparisonStatus, 'requires_manual_review');
});
test('HTML fallback requires product card entity and one bound price; dollar/yen symbols are ambiguous', () => {
  const html = `<section><h2>ChatGPT Plus</h2><p>¥99</p></section><article class="product-card"><h3>ChatGPT Plus 月卡</h3><div class="product-price"><del>¥199</del>¥160<span>/月</span></div><a href="/product/7">查看</a></article><div class="product-card"><h3>Pro</h3><div class="product-price">¥500 ¥600</div><a href="/price">查看</a></div>`;
  const result = extractOffers(html, URL, WHEN); assert.equal(result.offers.length, 1); assert.equal(result.offers[0].price, 160); assert.equal(result.offers[0].currency, 'unknown'); assert.equal(result.offers[0].billingPeriod.unit, 'month'); assert.ok(result.warnings.includes('AMBIGUOUS_CARD_PRICES_SKIPPED'));
});
test('data-price-of preserves product identity while unknown currency/tax remain unknown', () => {
  const result = extractOffers('<div class="product-card"><h3>ChatGPT</h3><div class="product-price">低至 <b data-price-of="chatgpt-go">79</b> /月</div><a href="/chatgpt/">查看</a></div>', 'https://gptpro20x.com/', WHEN);
  assert.equal(result.offers.length, 1); assert.match(result.offers[0].productName, /chatgpt-go/); assert.equal(result.offers[0].price, 79); assert.equal(result.offers[0].currency, 'unknown'); assert.equal(result.offers[0].priceType, 'from'); assert.equal(result.offers[0].billingPeriod.unit, 'month');
});
test('hidden or inert ancestors cannot expose card prices, while visible card still works', () => {
  const card = '<article class="product-card"><h3>Plus 月卡</h3><div class="product-price">CNY 160/月</div><a href="/product/7">查看</a></article>';
  for (const wrap of [(v) => `<div hidden>${v}</div>`, (v) => `<section aria-hidden="true"><div>${v}</div></section>`, (v) => `<div style="display: none">${v}</div>`, (v) => `<div style="visibility:hidden">${v}</div>`, (v) => `<template>${v}</template>`, (v) => `<script>${v}</script>`, (v) => `<style>${v}</style>`, (v) => `<noscript>${v}</noscript>`]) {
    assert.equal(extractOffers(wrap(card), URL, WHEN).offers.length, 0);
  }
  assert.equal(extractOffers(`<div>${card}</div>`, URL, WHEN).offers.length, 1);
});
test('ordinary JSON-LD remains eligible but hidden, template and script ancestors are excluded', () => {
  const script = `<script type="application/ld+json">${JSON.stringify({ '@type': 'Offer', name: 'Plus 月卡', price: 160, priceCurrency: 'CNY' })}</script>`;
  assert.equal(extractOffers(`<head>${script}</head>`, URL, WHEN).offers.length, 1);
  for (const html of [`<template>${script}</template>`, `<div hidden>${script}</div>`, `<div aria-hidden="true">${script}</div>`, `<script>${script}</script>`, script.replace('<script ', '<script hidden ')]) assert.equal(extractOffers(html, URL, WHEN).offers.length, 0);
});
test('malformed JSON-LD and unrelated numbers cannot fabricate prices', () => {
  const result = extractOffers('<script type="application/ld+json">not json</script><p>Plus $20. 用户50000。发票支持。</p>', URL, WHEN);
  assert.deepEqual(result.offers, []); assert.ok(result.warnings.includes('INVALID_JSON_LD'));
});
test('deduplicates exact structured offers without merging different products, currency or prices', () => {
  const offer = { '@type': 'Offer', name: 'Plus 月卡', price: '160', priceCurrency: 'CNY' };
  const result = extractOffers(`<script type="application/ld+json">${JSON.stringify([offer, offer, { ...offer, price: '170' }])}</script>`, URL, WHEN);
  assert.equal(result.offers.length, 2);
});
test('offer-specific name overrides catalog service name and plan numbers are not billing durations', () => {
  const data = { '@type': 'Service', name: 'All subscription plans', hasOfferCatalog: { itemListElement: [{ '@type': 'Offer', name: 'ChatGPT Pro 200 月卡', price: '1600', priceCurrency: 'CNY' }, { '@type': 'Offer', name: 'Plus 3个月', price: '480', priceCurrency: 'CNY' }] } };
  const result = extractOffers(`<script type="application/ld+json">${JSON.stringify(data)}</script>`, URL, WHEN);
  assert.equal(result.offers[0].productName, 'ChatGPT Pro 200 月卡'); assert.deepEqual(result.offers[0].billingPeriod, { unit: 'month', count: 1 });
  assert.deepEqual(result.offers[1].billingPeriod, { unit: 'month', count: 3 });
});
test('complete Chinese duration tokens are parsed or remain unknown, never truncated to a final digit', () => {
  const samples = [['十二', 12], ['二十', 20], ['二十二', 22], ['九十九', 99], ['十', 10], ['两', 2], ['一百二十', null], ['一千零二', null], ['零', null], ['1.5', null], ['-3', null]];
  for (const [token, count] of samples) {
    const data = { '@type': 'Offer', name: `Plus ${token}个月月卡`, price: 160, priceCurrency: 'CNY' };
    const offer = extractOffers(`<script type="application/ld+json">${JSON.stringify(data)}</script>`, URL, WHEN).offers[0];
    assert.deepEqual(offer.billingPeriod, count === null ? { unit: 'unknown', count: null } : { unit: 'month', count }, token);
    const markdown = renderPriceMarkdown({ generatedAt: WHEN, pages: [{ sourceName: 'source', sourceUrl: URL, observedAt: WHEN, offers: [offer] }] });
    assert.ok(markdown.includes(`| ${count === null ? 'unknown' : `${count} month`} |`));
  }
});
test('Markdown output literalizes merchant-controlled text and protects intentional source link destinations', () => {
  const attack = '![tracking](https://example.com/pixel) [link](https://example.com/) `code` \\ **bold** | <img src=x> &#91;';
  const offer = extractOffers(`<script type="application/ld+json">${JSON.stringify({ '@type': 'Offer', name: 'Plus 月卡', price: 160, priceCurrency: 'CNY' })}</script>`, URL, WHEN).offers[0];
  const markdown = renderPriceMarkdown({ generatedAt: attack, pages: [{ sourceName: attack, sourceUrl: 'https://example.com/)![escape](https://example.com/pixel)', observedAt: attack, status: attack, offers: [{ ...offer, productName: attack, sourceUrl: 'https://payforgpt.com/path)![escape](https://example.com/pixel)', currency: attack, accountType: attack, evidence: { method: attack }, observedAt: attack }] }, { sourceName: attack, sourceUrl: 'https://example.com/)![escape](https://example.com/pixel)', observedAt: attack, status: attack, offers: [] }] });
  assert.doesNotMatch(markdown, /!\[|\]\(https:\/\/example\.com|<img|`code`|\*\*bold\*\*/);
  assert.match(markdown, /&#33;&#91;tracking&#93;&#40;https&#58;&#47;&#47;example&#46;com&#47;pixel&#41;/);
  assert.match(markdown, /https:\/\/payforgpt\.com\/path%29!%5Bescape%5D%28https:\/\/example\.com\/pixel%29/);
  assert.match(markdown, /&#38;&#35;91&#59;/);
});
test('buy-button entity may expose public quote without clicking; external checkout URL is never carried', () => {
  const result = extractOffers('<div class="price-card"><h3>ChatGPT Pro 5×</h3><div class="price-num">¥<b data-price-of="chatgpt-pro5">818</b>/月</div><button data-buy="chatgpt-pro5">购买</button></div><article class="variant-card"><h3>Plus 月卡</h3><div class="variant-price">¥178/月</div><a href="https://checkout.example/item/1">卖方</a></article>', 'https://gptpro20x.com/chatgpt/', WHEN);
  assert.equal(result.offers.length, 2); assert.equal(result.offers[0].price, 818); assert.equal(result.offers[0].productUrl, 'https://gptpro20x.com/chatgpt/'); assert.equal(result.offers[1].productUrl, null);
});
test('official price commentary and a credit unit are not merchant price or quoted currency', () => {
  const html = '<div class="price-card"><h3>ChatGPT Pro 500</h3><p class="price-desc">官方 $500/月</p><div class="price-num">¥<b data-price-of="pro500">3880</b>/月</div><button data-buy="pro500">购买</button></div><div class="mini-plan"><h3>Codex API 额度充值</h3><div class="mini-price">¥<b data-price-of="credits">8.4</b>/美元</div><a href="/codex/">说明</a></div>';
  const result = extractOffers(html, 'https://gptpro20x.com/chatgpt/', WHEN);
  assert.equal(result.offers.length, 2); assert.equal(result.offers[0].price, 3880); assert.equal(result.offers[1].currency, 'unknown'); assert.equal(result.offers[1].productKind, 'api_credit');
});
test('validates source IDs and host uniqueness; no arbitrary source may enter fetcher', () => {
  assert.equal(validateSources({ sources: [{ id: 'pfg', name: 'PayForGPT', url: URL }] }).length, 1);
  assert.throws(() => validateSources({ sources: [{ id: 'pfg', name: 'x', url: URL }, { id: 'pfg2', name: 'y', url: 'https://www.payforgpt.com/' }] }), /DUPLICATE_SOURCE_HOST/);
  assert.throws(() => validateSources({ sources: [{ id: 'pfg', name: 'x', url: 'https://example.com/' }] }));
});
test('failed or blocked retrieval remains null with bounded reason, never zero', async () => {
  const report = await collectPrices([{ id: 'pfg', name: 'PayForGPT', url: URL }], async () => { throw new Error('HTTP_403'); }, () => WHEN);
  assert.equal(report.pages[0].priceWhenUnavailable, null); assert.deepEqual(report.pages[0].offers, []); assert.equal(report.pages[0].reason, 'HTTP_403'); assert.equal(report.automaticComparison, false);
  assert.match(renderPriceMarkdown(report), /null/); assert.doesNotMatch(renderPriceMarkdown(report), /\| 0 /);
});
test('source provenance and HTML digest are preserved in collection', async () => {
  const report = await collectPrices([{ id: 'pfg', name: 'PayForGPT', url: URL }], async () => ({ url: URL, status: 200, bytes: 20, bodySha256: 'a'.repeat(64), redirects: [], html: '<h1>No advertised offers</h1>' }), () => WHEN);
  assert.equal(report.pages[0].bodySha256, 'a'.repeat(64)); assert.equal(report.pages[0].status, 'no_entity_bound_price_found'); assert.equal(report.pages[0].httpStatus, 200);
});
test('writes only inside data; traversal, absolute paths and symlink destinations fail', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'guide-prices-test-')); const report = { generatedAt: WHEN, pages: [] };
  try {
    assert.throws(() => dataPath('../outside', root)); assert.throws(() => dataPath('/tmp/outside', root));
    await writeReport(report, 'data/prices', root); assert.equal(JSON.parse(await readFile(path.join(root, 'data/prices/latest.json'), 'utf8')).generatedAt, WHEN);
    await mkdir(path.join(root, 'outside')); await symlink(path.join(root, 'outside'), path.join(root, 'data', 'linked')); await assert.rejects(writeReport(report, 'data/linked', root), /SYMLINK_NOT_ALLOWED/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
