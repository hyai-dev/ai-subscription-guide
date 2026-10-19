import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO = 'hyai-dev/ai-subscription-guide';
export const SITE_ORIGINS = { payforgpt: 'https://payforgpt.com', nano: 'https://nano-banana.lol' };
export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const EDITORIAL_MARKUP = new Set('|<>\r\n\\[]()!`*_#~{}&'.split(''));
function isEditorialLabel(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 120
    && !/[\u0000-\u001f\u007f]/.test(value) && ![...value].some(c => EDITORIAL_MARKUP.has(c));
}

export function localFile(relative, root = ROOT, prefix) {
  if (typeof relative !== 'string' || relative.includes('\\') || path.isAbsolute(relative) || relative.split('/').includes('..')) throw new Error('Only repository-relative paths are allowed');
  if (prefix && !relative.startsWith(prefix)) throw new Error(`Expected ${prefix} path`);
  const realRoot = fs.realpathSync(root);
  const real = fs.realpathSync(path.resolve(root, relative));
  if (!real.startsWith(realRoot + path.sep) || !fs.statSync(real).isFile()) throw new Error('File must remain inside the repository');
  return real;
}

export function trackedUrl(site, target, topic) {
  if (!Object.hasOwn(SITE_ORIGINS, site) || !/^[a-z0-9-]+$/.test(topic)) throw new Error('Unknown site or topic');
  const u = new URL(target);
  if (u.origin !== SITE_ORIGINS[site] || u.username || u.password) throw new Error('Target must belong to the selected site');
  u.searchParams.set('utm_source', 'github');
  u.searchParams.set('utm_medium', 'referral');
  u.searchParams.set('utm_campaign', `ai_subscription_guide_${topic.replaceAll('-', '_')}_${site}`);
  return u.href;
}

export function loadCatalog(root = ROOT, relative = 'content/publication-manifest.json') {
  const data = JSON.parse(fs.readFileSync(localFile(relative, root, 'content/'), 'utf8'));
  if (data.schemaVersion !== 1 || data.repository !== REPO || !Array.isArray(data.articles) || !data.articles.length) throw new Error('Invalid publication manifest');
  const ids = new Set(), files = new Set(), canonicals = new Set(), queries = new Set();
  for (const a of data.articles) {
    if (!/^[a-z0-9-]+$/.test(a.id) || ids.has(a.id)) throw new Error('Duplicate or invalid article id');
    ids.add(a.id);
    if (files.has(a.file)) throw new Error('Duplicate primary article');
    files.add(a.file);
    if (!a.file.endsWith('.md')) throw new Error('Expected a Markdown article');
    const text = fs.readFileSync(localFile(a.file, root, 'docs/'), 'utf8');
    if (text.match(/^# /gm)?.length !== 1 || text.split('\n').find(l => l.startsWith('# ')) !== `# ${a.title}`) throw new Error(`Article title mismatch: ${a.id}`);
    const canonical = `https://github.com/${REPO}/blob/main/${a.file}`;
    if (a.canonical !== canonical || canonicals.has(canonical)) throw new Error('Primary URL mismatch');
    canonicals.add(canonical);
    for (const date of [a.publishedAt, a.reviewedAt]) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('Invalid date');
    }
    if (a.reviewedAt < a.publishedAt) throw new Error('Review predates publication');
    if (a.reviewedAt > new Date().toISOString().slice(0, 10)) throw new Error('Future review date');
    if (!Array.isArray(a.sources) || !a.sources.length || !Array.isArray(a.figures) || !a.figures.length) throw new Error('Sources and illustrations are required');
    for (const source of a.sources) {
      const u = new URL(source);
      if (u.protocol !== 'https:' || u.username || u.password || !text.includes(source)) throw new Error('Invalid or missing source');
    }
    for (const figure of a.figures) {
      localFile(figure, root, 'assets/');
      if (!text.includes(`../${figure}`)) throw new Error('Illustration missing from the article');
    }
    if (!Array.isArray(a.targets)) throw new Error('Targets must be an array; pure task tutorials may have no commercial target');
    for (const t of a.targets) trackedUrl(t.site, t.url, a.topic);
    if (a.keywordQueueSite !== undefined && !isEditorialLabel(a.keywordQueueSite)) throw new Error('Invalid keyword queue site label');
    if (a.primaryQuery !== undefined) {
      if (!isEditorialLabel(a.cluster) || !Array.isArray(a.secondaryQueries)) throw new Error('Query owners need a literal topic cluster and secondary query array');
      for (const query of [a.primaryQuery, ...a.secondaryQueries]) {
        if (!isEditorialLabel(query)) throw new Error('Invalid editorial query');
        const normalized = query.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
        if (queries.has(normalized)) throw new Error('A query must have one primary article owner');
        queries.add(normalized);
      }
    }
  }
  return data;
}

export function publicationIndex(catalog, root = ROOT) {
  return {
    schemaVersion: 1, repository: REPO,
    note: 'Editorial inventory, not a traffic, ranking, transaction or public-readback receipt. Stable archives are copies of these primary tutorials, not extra original articles.',
    articles: catalog.articles.map(a => ({ ...a, sha256: sha256(fs.readFileSync(localFile(a.file, root))),
      archive: `articles/${a.id}.md`,
      figures: a.figures.map(file => ({ file, sha256: sha256(fs.readFileSync(localFile(file, root))) })),
      targets: a.targets.map(t => ({ ...t, trackedUrl: trackedUrl(t.site, t.url, a.topic) }))
    }))
  };
}
