import fs from 'node:fs';
import path from 'node:path';
import { ROOT, REPO, sha256, loadCatalog } from './catalog.mjs';

const hosts = new Set(['github.com', 'raw.githubusercontent.com', 'payforgpt.com', 'nano-banana.lol']);
async function publicRead(input, { expectedHash, binary = false } = {}) {
  let url = new URL(input);
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (url.protocol !== 'https:' || !hosts.has(url.hostname) || url.username || url.password || url.port) throw new Error('Public-read destination is not allowed');
    const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'AI-Subscription-Guide-Public-Check/1.0' } });
    if ([301, 302, 303, 307, 308].includes(r.status)) { const next = r.headers.get('location'); await r.body?.cancel(); if (!next) throw new Error('Missing redirect destination'); url = new URL(next, url); continue; }
    if (r.status !== 200) { await r.body?.cancel(); throw new Error(`HTTP ${r.status}: ${url.hostname}${url.pathname}`); }
    const chunks = []; let size = 0;
    for await (const chunk of r.body) { size += chunk.length; if (size > 3 * 1024 * 1024) throw new Error('Response too large'); chunks.push(chunk); }
    const bytes = Buffer.concat(chunks), hash = sha256(bytes);
    if (expectedHash && hash !== expectedHash) throw new Error(`Public byte mismatch: ${url.pathname}`);
    if (binary && !r.headers.get('content-type')?.startsWith('image/')) throw new Error('Expected a public image');
    return { requestedUrl: input, resolvedUrl: url.href, status: r.status, bytes: size, sha256: hash };
  }
  throw new Error('Too many redirects');
}

try {
  const args = process.argv.slice(2), commitIndex = args.indexOf('--commit');
  if (commitIndex === -1 || args.length !== 2 || commitIndex !== 0 || !/^[a-f0-9]{40}$/.test(args[1])) throw new Error('Use --commit followed by an exact 40-character source SHA');
  const commit = args[1], catalog = loadCatalog(), records = [], checked = new Set();
  const readFile = async (file, binary = false) => {
    if (checked.has(file)) return; checked.add(file);
    records.push(await publicRead(`https://raw.githubusercontent.com/${REPO}/${commit}/${file}`, { expectedHash: sha256(fs.readFileSync(path.join(ROOT, file))), binary }));
  };
  await readFile('README.md');
  for (const article of catalog.articles) {
    await readFile(article.file);
    for (const figure of article.figures) await readFile(figure, true);
  }
  const targets = [...new Set(catalog.articles.flatMap(a => a.targets.map(t => t.url)))];
  for (const target of targets) records.push(await publicRead(target));
  console.log(JSON.stringify({ repository: REPO, commit, checkedAtUtc: new Date().toISOString(), status: 'pass', primaryArticles: catalog.articles.length, records,
    boundary: 'Anonymous GET and immutable source/image byte checks only. No real transaction, product UI or model output tested; no indexing, ranking or conversion established.' }, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
