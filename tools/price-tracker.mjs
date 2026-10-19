#!/usr/bin/env node
/** Original, dependency-free public price observation tool. It never runs git. */
import { lookup as dnsLookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { lstat, mkdir, readFile, realpath, rename, writeFile } from 'node:fs/promises';

export const LIMITS = Object.freeze({ timeoutMs: 15_000, maxBytes: 2 * 1024 * 1024, redirects: 3, maxOffers: 100 });
const DOMAIN_NAMES = ['gptpro20x.com', 'gptpro5x.com', 'gptcz.pro', 'aichongzhi.org', 'getgpt.pro', 'payforchat.com', 'nano-banana.lol', 'payforgpt.com'];
export const ALLOWED_HOSTS = new Set(DOMAIN_NAMES.flatMap((host) => [host, `www.${host}`]));
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

export function validatePublicUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('URL_NOT_ALLOWED');
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase()) || url.hash) throw new Error('HOST_NOT_ALLOWED');
  let pathname; try { pathname = decodeURIComponent(url.pathname); } catch { throw new Error('URL_NOT_ALLOWED'); }
  if (/\/(?:api|admin|checkout|order|login|pay|purchase|redeem)(?:\/|$)/i.test(pathname) || /\\/.test(pathname)) throw new Error('NON_PUBLIC_PAGE_NOT_ALLOWED');
  if (url.search) throw new Error('QUERY_NOT_ALLOWED');
  return url;
}

export function isPublicAddress(address) {
  const family = isIP(address);
  if (family === 4) {
    const p = address.split('.').map(Number);
    if ([0, 10, 127].includes(p[0]) || p[0] >= 224) return false;
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return false;
    if (p[0] === 169 && p[1] === 254) return false;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return false;
    if (p[0] === 192 && (p[1] === 168 || (p[1] === 0 && [0, 2].includes(p[2])) || (p[1] === 88 && p[2] === 99))) return false;
    if (p[0] === 198 && ([18, 19].includes(p[1]) || (p[1] === 51 && p[2] === 100))) return false;
    if (p[0] === 203 && p[1] === 0 && p[2] === 113) return false;
    return true;
  }
  if (family === 6) {
    const lower = address.toLowerCase();
    // Global unicast only; excludes loopback, link-local, ULA, mapped IPv4,
    // multicast, documentation, benchmarking and transition ranges.
    const [first, second] = lower.split(':').map((part) => parseInt(part || '0', 16));
    return first >= 0x2000 && first <= 0x3fff && ![0x2002, 0x3fff].includes(first)
      && !(first === 0x2001 && (second < 0x0200 || second === 0x0db8));
  }
  return false;
}

export async function resolvePublicAddresses(hostname, lookup = dnsLookup) {
  const records = await lookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => !isPublicAddress(record.address))) throw new Error('NON_PUBLIC_DNS_ADDRESS');
  return records;
}

function pinnedLookup(records) {
  return (_hostname, options, callback) => {
    const requested = typeof options === 'object' ? options.family : options;
    const candidates = records.filter((record) => !requested || record.family === requested);
    if (!candidates.length) return callback(new Error('DNS_FAMILY_UNAVAILABLE'));
    if (typeof options === 'object' && options.all) callback(null, candidates);
    else callback(null, candidates[0].address, candidates[0].family);
  };
}

export async function fetchPublicHtml(input, options = {}) {
  const timeoutMs = Math.min(options.timeoutMs ?? LIMITS.timeoutMs, LIMITS.timeoutMs);
  const maxBytes = Math.min(options.maxBytes ?? LIMITS.maxBytes, LIMITS.maxBytes);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || !Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('INVALID_FETCH_LIMIT');
  const request = options.request ?? httpsRequest;
  let url = validatePublicUrl(input);
  const redirects = [];
  for (let hop = 0; hop <= LIMITS.redirects; hop++) {
    let dnsTimer;
    const records = await Promise.race([
      resolvePublicAddresses(url.hostname, options.lookup),
      new Promise((_, reject) => { dnsTimer = setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), timeoutMs); }),
    ]).finally(() => clearTimeout(dnsTimer));
    const response = await new Promise((resolve, reject) => {
      let timer;
      const req = request(url, {
        method: 'GET', lookup: pinnedLookup(records),
        headers: { 'User-Agent': 'AI-Subscription-Guide-Public-Price-Observation/1.0', Accept: 'text/html,application/ld+json;q=0.8', 'Accept-Encoding': 'identity' },
      }, (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.destroy(); clearTimeout(timer);
          resolve({ status, location: res.headers.location }); return;
        }
        if (status !== 200) { res.destroy(); clearTimeout(timer); reject(new Error(`HTTP_${status}`)); return; }
        if (!/^(?:text\/html|application\/(?:xhtml\+xml|ld\+json|json))(?:;|$)/i.test(res.headers['content-type'] ?? '')) {
          res.destroy(); clearTimeout(timer); reject(new Error('UNSUPPORTED_CONTENT_TYPE')); return;
        }
        if (res.headers['content-encoding'] && res.headers['content-encoding'] !== 'identity') { res.destroy(); clearTimeout(timer); reject(new Error('UNSUPPORTED_CONTENT_ENCODING')); return; }
        if (Number(res.headers['content-length'] ?? 0) > maxBytes) { res.destroy(); clearTimeout(timer); reject(new Error('RESPONSE_TOO_LARGE')); return; }
        const chunks = []; let length = 0;
        res.on('data', (chunk) => {
          length += chunk.length;
          if (length > maxBytes) { res.destroy(new Error('RESPONSE_TOO_LARGE')); return; }
          chunks.push(chunk);
        });
        res.on('end', () => { clearTimeout(timer); resolve({ status, body: Buffer.concat(chunks), contentType: res.headers['content-type'] }); });
        res.on('error', (error) => { clearTimeout(timer); reject(error); });
      });
      timer = setTimeout(() => req.destroy(new Error('REQUEST_TIMEOUT')), timeoutMs);
      req.on('error', (error) => { clearTimeout(timer); reject(error); });
      req.end();
    });
    if (response.location) {
      if (hop === LIMITS.redirects) throw new Error('TOO_MANY_REDIRECTS');
      const next = validatePublicUrl(new URL(response.location, url).href);
      redirects.push({ from: url.href, to: next.href, status: response.status }); url = next; continue;
    }
    return { url: url.href, status: response.status, redirects, bytes: response.body.length, bodySha256: createHash('sha256').update(response.body).digest('hex'), html: response.body.toString('utf8') };
  }
  throw new Error('TOO_MANY_REDIRECTS');
}

function decode(value) {
  return String(value ?? '').replace(/&(?:#(x[0-9a-f]+|\d+)|([a-z]+));/gi, (whole, numeric, name) => {
    if (numeric) { const n = numeric[0].toLowerCase() === 'x' ? parseInt(numeric.slice(1), 16) : Number(numeric); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole; }
    return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', yen: '¥', pound: '£', euro: '€' })[name.toLowerCase()] ?? whole;
  });
}
function clean(value) { return decode(value).replace(/\s+/g, ' ').trim(); }
export function parsePrice(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!/^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,4})?$/.test(text)) return null;
  const number = Number(text.replaceAll(',', ''));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function types(value) { return (Array.isArray(value?.['@type']) ? value['@type'] : [value?.['@type']]).filter(Boolean).map((v) => String(v).replace(/^https?:\/\/schema.org\//, '')); }
function billingPeriod(text) {
  // Capture the complete duration token. Matching a final Chinese digit would
  // incorrectly turn 十二个月 into 2 months, or 二十个月 into 10 months.
  const counted = text.match(/([-+0-9零〇一二两三四五六七八九十百千万亿点.]+)\s*个月|\b([-+]?\d+(?:\.\d+)?)\s*months?\b/i);
  if (counted) {
    const token = counted[1] || counted[2]; let count = null;
    if (/^[1-9]\d{0,2}$/.test(token)) count = Number(token);
    else if (/^[一二两三四五六七八九]$/.test(token)) count = token === '两' ? 2 : '一二三四五六七八九'.indexOf(token) + 1;
    else {
      const tens = token.match(/^([一二三四五六七八九])?十([一二三四五六七八九])?$/);
      if (tens) count = (tens[1] ? '一二三四五六七八九'.indexOf(tens[1]) + 1 : 1) * 10 + (tens[2] ? '一二三四五六七八九'.indexOf(tens[2]) + 1 : 0);
    }
    return count === null ? { unit: 'unknown', count: null } : { unit: 'month', count };
  }
  if (/(?:月卡|月度|每月|\/\s*月|\bmonthly\b|\bP1M\b)/i.test(text)) return { unit: 'month', count: 1 };
  if (/(?:年卡|年度|每年|\/\s*年|\byearly\b|\bannual\b|\bP1Y\b)/i.test(text)) return { unit: 'year', count: 1 };
  return { unit: 'unknown', count: null };
}
function accountType(text) {
  const hits = [
    [/合租|共享|\bshared\b/i, 'shared_account'],
    [/原号|本人账号|自己(?:的)?账号|\bown.account\b/i, 'own_account'],
    [/成品(?:号|账号)|\bready.made.account\b/i, 'provided_account'],
    [/卡密|兑换码|\bredemption.code\b/i, 'redemption_code'],
  ].filter(([pattern]) => pattern.test(text));
  return hits.length === 1 ? hits[0][1] : 'unknown';
}
function tier(text) {
  if (/\b(?:20\s*[x×]|pro\s*200)\b/i.test(text)) return 'merchant_pro_20x_or_200';
  if (/\b(?:5\s*[x×]|pro\s*100)\b/i.test(text)) return 'merchant_pro_5x_or_100';
  if (/\bplus\b/i.test(text)) return 'plus';
  if (/\bpro\b/i.test(text)) return 'pro_unspecified';
  if (/\bgo\b/i.test(text)) return 'go';
  return 'unknown';
}
function safeProductUrl(value, sourceUrl) {
  try {
    const u = new URL(value || sourceUrl, sourceUrl);
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) if (key !== 'tab' || !/^[a-z0-9-]{1,30}$/i.test(u.searchParams.get(key))) u.searchParams.delete(key);
    const query = u.search; u.search = ''; validatePublicUrl(u.href); u.search = query;
    return u.href;
  } catch { return null; }
}
function makeOffer({ name, price, currency, url, text = '', method, pointer, priceType = 'fixed', availability = 'unknown' }, sourceUrl, observedAt) {
  const context = clean(`${name} ${text}`);
  const period = billingPeriod(context);
  const identity = accountType(context);
  return {
    productName: clean(name).slice(0, 180), merchantTierLabel: tier(name), productKind: /\bAPI\b|额度充值/i.test(name) ? 'api_credit' : /ChatGPT|Claude|Gemini|Grok|\bPlus\b|\bPro\b/i.test(name) ? 'subscription_or_recharge' : 'unknown', price, currency: ['CNY', 'USD', 'EUR', 'GBP', 'JPY', 'HKD', 'SGD', 'AUD', 'CAD', 'TWD'].includes(currency) ? currency : 'unknown',
    billingPeriod: period, accountType: identity, priceType, availabilityClaim: availability,
    productUrl: safeProductUrl(url, sourceUrl), sourceUrl, observedAt,
    taxStatus: { value: 'unknown', sourceUrl, observedAt },
    simSupport: { value: 'unknown', sourceUrl, observedAt },
    invoiceSupport: { value: 'unknown', sourceUrl, observedAt },
    eligibility: { value: 'unknown', sourceUrl, observedAt },
    evidence: { method, pointer, excerpt: context.slice(0, 120) },
    humanReviewRequired: true, comparisonStatus: 'requires_manual_review',
    limitations: ['Advertised source claim, not a completed transaction or independent entitlement check.', 'Do not compare until currency, period, account identity, eligibility, tax and final checkout total are checked.'],
  };
}

function parseDom(html) {
  const root = { tag: '#root', attrs: {}, children: [] }; const stack = [root]; const nodes = [];
  for (const match of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[A-Za-z][^>]*>|[^<]+/g)) {
    const token = match[0];
    if (token.startsWith('<!--') || token.startsWith('<!')) continue;
    if (token.startsWith('</')) {
      const tag = token.match(/^<\/\s*([^\s>]+)/)?.[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) { stack.length = i; break; }
    } else if (token.startsWith('<')) {
      const tag = token.match(/^<([^\s/>]+)/)?.[1].toLowerCase(); if (!tag) continue;
      const attrs = {};
      for (const m of token.slice(tag.length + 1, -1).matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
      const node = { tag, attrs, children: [], parent: stack.at(-1), index: nodes.length }; nodes.push(node); stack.at(-1).children.push(node);
      if (!VOID.has(tag) && !token.endsWith('/>')) stack.push(node);
    } else stack.at(-1).children.push(token);
  }
  return { root, nodes };
}
function hidden(node, allowJsonLdScript = false) { return (['script', 'style', 'template', 'noscript', 'del', 's', 'strike'].includes(node.tag) && !(allowJsonLdScript && node.tag === 'script' && node.attrs.type?.toLowerCase() === 'application/ld+json')) || Object.hasOwn(node.attrs, 'hidden') || node.attrs['aria-hidden']?.toLowerCase() === 'true' || /display\s*:\s*none|visibility\s*:\s*hidden/i.test(node.attrs.style ?? ''); }
function hiddenAncestor(node) { for (let parent = node.parent; parent; parent = parent.parent) if (hidden(parent)) return true; return false; }
function nodeText(node) { if (typeof node === 'string') return node; if (hidden(node)) return ''; return clean(node.children.map(nodeText).join(' ')); }
function descendants(node) { const values = []; for (const child of node.children) if (typeof child !== 'string' && !hidden(child)) { values.push(child, ...descendants(child)); } return values; }
function currencyFrom(text) {
  // A suffix such as "¥8.4 / 美元" is a unit of credits, not the quoted
  // price's denomination. Never treat a plan's "$200" name as currency proof.
  text = text.split(/[\/／]/, 1)[0].replace(/(?:\bper\b|每)[\s\S]*$/i, '');
  if (/\bCNY\b|人民币/i.test(text)) return 'CNY';
  if (/\bUSD\b|美元/i.test(text)) return 'USD';
  if (/\bEUR\b|欧元|€/i.test(text)) return 'EUR';
  if (/\bGBP\b|英镑|£/i.test(text)) return 'GBP';
  if (/\bJPY\b|日元/i.test(text)) return 'JPY';
  return 'unknown'; // ¥ and $ alone are ambiguous; no guessed currency.
}

export function extractOffers(html, sourceUrl, observedAt = new Date().toISOString()) {
  const offers = []; const warnings = []; const { nodes } = parseDom(html);
  function add(offer) { if (offers.length < LIMITS.maxOffers) offers.push(offer); }
  for (const script of nodes.filter((node) => node.tag === 'script' && node.attrs.type?.toLowerCase() === 'application/ld+json' && !hidden(node, true) && !hiddenAncestor(node))) {
    let data; try { data = JSON.parse(script.children.filter((v) => typeof v === 'string').join('')); } catch { warnings.push('INVALID_JSON_LD'); continue; }
    const walk = (value, pointer = '$', parentEntity = null) => {
      if (Array.isArray(value)) return value.forEach((v, i) => walk(v, `${pointer}[${i}]`, parentEntity));
      if (!value || typeof value !== 'object') return;
      const kind = types(value);
      const entity = kind.some((v) => ['Product', 'Service', 'ProductGroup'].includes(v)) ? value : parentEntity;
      if (kind.includes('Offer') && Object.hasOwn(value, 'price')) {
        const item = value.itemOffered && typeof value.itemOffered === 'object' ? value.itemOffered : entity;
        const name = value.itemOffered?.name || value.name || item?.name;
        const price = parsePrice(value.price);
        if (typeof name === 'string' && name.trim() && price !== null) add(makeOffer({ name, price, currency: value.priceCurrency || value.priceSpecification?.priceCurrency, url: value.url || item?.url, text: `${value.name ?? ''} ${value.priceSpecification?.billingDuration ?? ''}`, method: 'json-ld-offer', pointer: `${pointer}.price`, availability: value.availability || 'unknown' }, sourceUrl, observedAt));
      }
      for (const [key, child] of Object.entries(value)) if (key !== '@context') walk(child, `${pointer}.${key}`, entity);
    };
    walk(data);
  }
  // HTML fallback is entity-bound: one identifiable card, product name, offer
  // link and one price element. It does not scan a short price/title window.
  for (const card of nodes.filter((node) => /(?:^|\s)(?:product-card|plan-card|pricing-card|price-card|hero-shortcut|variant-card|mini-plan)(?:\s|$)/i.test(node.attrs.class ?? '') && !hidden(node) && !hiddenAncestor(node))) {
    const children = descendants(card); const fullText = nodeText(card);
    if (fullText.length > 2400) { warnings.push('OVERSIZED_CARD_SKIPPED'); continue; }
    const heading = children.find((node) => /^h[2-6]$/.test(node.tag)) || children.find((node) => /(?:product-title|plan-name|shortcut-name)/i.test(node.attrs.class ?? ''));
    const link = (card.tag === 'a' ? card : null) || children.find((node) => node.tag === 'a' && node.attrs.href);
    const buyButton = children.find((node) => node.tag === 'button' && node.attrs['data-buy']);
    if (!heading || (!link && !buyButton)) continue;
    const priceNodes = children.filter((node) => Object.hasOwn(node.attrs, 'data-price-of') || /(?:^|\s)(?:price|product-price|variant-price|hero-shortcut-price|mini-price|price-num|plan-price|price-amount|price-value)(?:\s|$)/.test(node.attrs.class ?? ''));
    const candidates = []; let ambiguous = false;
    for (const node of priceNodes) {
      const text = nodeText(node); let amount;
      if (node.attrs['data-price-of']) amount = parsePrice(text);
      else { const matches = [...text.matchAll(/(?:CNY|USD|EUR|GBP|JPY|人民币|美元|¥|￥|\$|€|£)\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,4})?)/gi)]; if (matches.length === 1) amount = parsePrice(matches[0][1]); else if (matches.length > 1) ambiguous = true; }
      if (amount !== null && amount !== undefined) candidates.push({ amount, node, text });
    }
    const amounts = [...new Set(candidates.map((candidate) => candidate.amount))];
    if (ambiguous || amounts.length !== 1) { if (ambiguous || amounts.length > 1) warnings.push('AMBIGUOUS_CARD_PRICES_SKIPPED'); continue; }
    const candidate = candidates.find((v) => v.node.attrs['data-price-of']) || candidates[0];
    const id = candidate.node.attrs['data-price-of'];
    const name = `${nodeText(heading)}${id ? ` [${id}]` : ''}`;
    const priceContext = id && /(?:^|[\s_-])price(?:$|[\s_-])/.test(candidate.node.parent?.attrs.class ?? '') ? nodeText(candidate.node.parent) : candidate.text;
    const explicitCurrency = card.attrs['data-currency'];
    add(makeOffer({ name, price: amounts[0], currency: explicitCurrency || currencyFrom(priceContext), url: link?.attrs.href || sourceUrl, text: priceContext, method: 'html-product-card', pointer: `card[${card.index}]`, priceType: /低至|起|from/i.test(priceContext) ? 'from' : 'fixed' }, sourceUrl, observedAt));
  }
  const seen = new Set();
  const unique = offers.filter((offer) => { const key = JSON.stringify([offer.productName, offer.productUrl, offer.price, offer.currency]); if (seen.has(key)) return false; seen.add(key); return true; });
  return { offers: unique, warnings: [...new Set(warnings)], status: unique.length ? 'observed_advertised_offers' : 'no_entity_bound_price_found' };
}

export function validateSources(document) {
  if (!document || !Array.isArray(document.sources) || document.sources.length < 1 || document.sources.length > 8) throw new Error('INVALID_SOURCES');
  const ids = new Set(); const hosts = new Set();
  return document.sources.map((source) => {
    if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(source.id ?? '') || ids.has(source.id) || typeof source.name !== 'string' || !source.name.trim()) throw new Error('INVALID_SOURCE_ID');
    const url = validatePublicUrl(source.url); const host = url.hostname.replace(/^www\./, '');
    if (hosts.has(host)) throw new Error('DUPLICATE_SOURCE_HOST');
    ids.add(source.id); hosts.add(host);
    return { id: source.id, name: source.name.slice(0, 100), url: url.href };
  });
}

export async function collectPrices(sources, fetcher = fetchPublicHtml, now = () => new Date().toISOString()) {
  const pages = [];
  for (const source of sources) {
    const observedAt = now();
    try {
      const result = await fetcher(source.url);
      const extraction = extractOffers(result.html, result.url, observedAt);
      pages.push({ sourceId: source.id, sourceName: source.name, requestedUrl: source.url, sourceUrl: result.url, observedAt, httpStatus: result.status, bodyBytes: result.bytes, bodySha256: result.bodySha256, redirects: result.redirects, ...extraction, priceWhenUnavailable: null });
    } catch (error) {
      const raw = typeof error?.message === 'string' ? error.message : '';
      // Report bounded machine reasons; do not expose DNS addresses or paths.
      const reason = /^(?:HTTP_\d{3}|URL_NOT_ALLOWED|HOST_NOT_ALLOWED|NON_PUBLIC_PAGE_NOT_ALLOWED|QUERY_NOT_ALLOWED|NON_PUBLIC_DNS_ADDRESS|DNS_FAMILY_UNAVAILABLE|UNSUPPORTED_CONTENT_TYPE|UNSUPPORTED_CONTENT_ENCODING|RESPONSE_TOO_LARGE|REQUEST_TIMEOUT|TOO_MANY_REDIRECTS)$/.test(raw) ? raw : 'FETCH_FAILED';
      pages.push({ sourceId: source.id, sourceName: source.name, requestedUrl: source.url, sourceUrl: source.url, observedAt, httpStatus: null, status: 'unavailable', reason, priceWhenUnavailable: null, offers: [], warnings: [] });
    }
  }
  return { schemaVersion: 'public-price-observation-v1', generatedAt: now(), scope: 'Public advertised source claims only; not checkout totals, independent product verification or a cheapest-price ranking.', automaticComparison: false, humanReviewRequired: true, pages };
}

// Numeric entities render source text literally without letting Markdown/HTML
// turn merchant names into images, links, code spans, table rows or raw tags.
function md(value) { return String(value ?? '').replace(/[\r\n\t]/g, ' ').replace(/[\u0021-\u002f\u003a-\u0040\u005b-\u0060\u007b-\u007e]/g, (character) => `&#${character.codePointAt(0)};`); }
function sourceLink(label, value) {
  try {
    const url = validatePublicUrl(value);
    const destination = url.href.replace(/[()[\]\\]/g, (character) => `%${character.codePointAt(0).toString(16).toUpperCase()}`);
    return `[${md(label)}](${destination})`;
  } catch { return `${md(label)}（${md(value)}）`; }
}
function periodLabel(period) { return period && ['month', 'year'].includes(period.unit) && Number.isSafeInteger(period.count) && period.count > 0 ? `${period.count} ${period.unit}` : 'unknown'; }
export function renderPriceMarkdown(report) {
  const rows = ['# 公开报价观察（待人工复核）', '', `生成时间：${md(report.generatedAt)}`, '', '只记录公开页面的商品报价声明；不代表实际结算总价、可售保证、发票承诺或独立权益验证。币种、周期、账号形态、资格及税费未核实时不能直接比较。抓取失败或未找到实体绑定报价记为未知，零价仍为 0。', '', '| 来源 | 商品 | 页面报价 | 周期 | 账号形态 | 实体SIM | 开票条件 | 提取方法 | 观察时间 |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const page of report.pages) {
    if (!page.offers.length) rows.push(`| ${sourceLink(page.sourceName, page.sourceUrl)} | 未知 | null | unknown | unknown | unknown | unknown | ${md(page.reason || page.status)} | ${md(page.observedAt)} |`);
    for (const offer of page.offers) rows.push(`| ${sourceLink(page.sourceName, offer.sourceUrl)} | ${md(offer.productName)} | ${offer.price === null ? 'null' : md(offer.price)} ${md(offer.currency)}${offer.priceType === 'from' ? ' 起' : ''} | ${md(periodLabel(offer.billingPeriod))} | ${md(offer.accountType)} | ${md(offer.simSupport?.value ?? 'unknown')} | ${md(offer.invoiceSupport?.value ?? 'unknown')} | ${md(offer.evidence.method)} | ${md(offer.observedAt)} |`);
  }
  rows.push('', 'SIM、发票、含税与购买资格字段默认 unknown，并保留来源和观察时间。unknown 不表示不支持；未见信息也不能写成竞品没有该能力。全部报价仍需人工核对商品、币种、周期、适用账号、税费和实际结算页。', '');
  return rows.join('\n');
}

export function dataPath(relative, root = ROOT) {
  if (path.isAbsolute(relative)) throw new Error('DATA_PATH_MUST_BE_RELATIVE');
  const target = path.resolve(root, relative); const data = path.resolve(root, 'data');
  if (target !== data && !target.startsWith(`${data}${path.sep}`)) throw new Error('PATH_OUTSIDE_DATA');
  return target;
}
async function noSymlinkParents(target, root) {
  const rel = path.relative(root, target); let current = root;
  for (const part of rel.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { const stat = await lstat(current); if (stat.isSymbolicLink()) throw new Error('SYMLINK_NOT_ALLOWED'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
export async function writeReport(report, outputDir, root = ROOT) {
  const output = dataPath(outputDir, root);
  await noSymlinkParents(output, root); await mkdir(output, { recursive: true });
  const actual = await realpath(output); const actualRoot = await realpath(root);
  if (actual !== path.join(actualRoot, 'data') && !actual.startsWith(`${path.join(actualRoot, 'data')}${path.sep}`)) throw new Error('PATH_OUTSIDE_DATA');
  for (const [filename, contents] of [['latest.json', `${JSON.stringify(report, null, 2)}\n`], ['latest.md', renderPriceMarkdown(report)]]) {
    const destination = path.join(output, filename); await noSymlinkParents(destination, root);
    const temporary = path.join(output, `.${filename}.${process.pid}.tmp`);
    await writeFile(temporary, contents, { flag: 'wx', mode: 0o644 }); await rename(temporary, destination);
  }
}
export async function main(argv = process.argv.slice(2)) {
  let sourceFile = 'data/price-sources.json'; let outputDir = 'data/prices';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--sources-file' && argv[i + 1]) sourceFile = argv[++i];
    else if (argv[i] === '--output-dir' && argv[i + 1]) outputDir = argv[++i];
    else if (argv[i] === '--help') { console.log('node tools/price-tracker.mjs [--sources-file data/price-sources.json] [--output-dir data/prices]\nOnly public allowlisted HTTPS pages; writes latest.json/latest.md inside repository data/. Never runs git.'); return; }
    else throw new Error('UNKNOWN_ARGUMENT');
  }
  const input = dataPath(sourceFile); await noSymlinkParents(input, ROOT);
  const inputStat = await lstat(input); if (!inputStat.isFile() || inputStat.size > 64 * 1024) throw new Error('INVALID_SOURCE_FILE');
  const sources = validateSources(JSON.parse(await readFile(input, 'utf8')));
  const report = await collectPrices(sources);
  await writeReport(report, outputDir);
  console.log(JSON.stringify({ sources: report.pages.length, sourcesWithOffers: report.pages.filter((p) => p.offers.length).length, unavailable: report.pages.filter((p) => p.status === 'unavailable').length, outputDir, humanReviewRequired: true }));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(`Price observation stopped: ${error.message}`); process.exitCode = 1; });
