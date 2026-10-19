import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, loadCatalog, publicationIndex } from './catalog.mjs';

export function replaceSection(text, name, content) {
  const start = `<!-- BEGIN ${name} -->`, end = `<!-- END ${name} -->`;
  if (text.split(start).length !== 2 || text.split(end).length !== 2 || text.indexOf(start) > text.indexOf(end)) throw new Error(`Unique ordered markers required: ${name}`);
  return text.slice(0, text.indexOf(start) + start.length) + '\n' + content + '\n' + text.slice(text.indexOf(end));
}

export function planSync(root = ROOT) {
  const catalog = loadCatalog(root);
  const index = publicationIndex(catalog, root);
  const sorted = catalog.articles.map((a, i) => ({ ...a, editorialOrder: i })).sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt) || b.publishedAt.localeCompare(a.publishedAt) || b.editorialOrder - a.editorialOrder);
  const latest = ['| 复核日期 | 教程 |', '| --- | --- |', ...sorted.slice(0, 10).map(a => `| ${a.reviewedAt} | [${a.title}](${a.file}) |`)].join('\n');
  const archiveIndex = catalog.articles.map(a => `- [${a.title}](${a.file}) · [稳定归档](articles/${a.id}.md)`).join('\n');
  let readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  readme = replaceSection(readme, 'LATEST', latest);
  readme = replaceSection(readme, 'ARCHIVE', archiveIndex);
  const clusters = new Map();
  for (const a of catalog.articles) {
    if (!a.primaryQuery) continue;
    if (!clusters.has(a.cluster)) clusters.set(a.cluster, []);
    clusters.get(a.cluster).push(`[${a.primaryQuery}](${a.file})`);
  }
  readme = replaceSection(readme, 'TOPIC MAP', ['| 主题 | 从搜索问题进入教程 |', '| --- | --- |', ...[...clusters].map(([cluster, entries]) => `| ${cluster} | ${entries.join(' · ')} |`)].join('\n'));
  const outputs = new Map([['README.md', readme], ['data/publication-index.json', JSON.stringify(index, null, 2) + '\n']]);
  const links = { schemaVersion: 1, source: 'github', medium: 'referral',
    measurementBoundary: 'Campaign URLs identify topic and site. Current site code does not yet establish end-to-end attribution to confirmed payment/delivery; links and source parameters alone do not prove collection or conversion.',
    links: index.articles.flatMap(a => a.targets.map(t => ({ article: a.id, topic: a.topic, site: t.site, canonical: t.url, url: t.trackedUrl })))
  };
  outputs.set('data/tracking-links.json', JSON.stringify(links, null, 2) + '\n');
  outputs.set('data/keyword-map.json', JSON.stringify({ schemaVersion: 1,
    scope: 'Editorial query-to-article map, with normalized exact duplicate queries rejected. These are assigned candidate queries, not verified search volume, rankings, traffic or all semantic variants.',
    primaryArticleCount: catalog.articles.length,
    topicClusterCount: clusters.size,
    assignedQueryCount: catalog.articles.reduce((n, a) => n + (a.primaryQuery ? 1 + a.secondaryQueries.length : 0), 0),
    owners: catalog.articles.filter(a => a.primaryQuery).map(a => ({ id: a.id, cluster: a.cluster, primaryQuery: a.primaryQuery, secondaryQueries: a.secondaryQueries, file: a.file, canonical: a.canonical, ...(a.keywordQueueSite ? { keywordQueueSite: a.keywordQueueSite } : {}), keywordQueueRows: a.keywordQueueRows ?? [], websiteOwners: a.websiteOwners ?? [] }))
  }, null, 2) + '\n');
  for (const a of catalog.articles) {
    const text = fs.readFileSync(path.join(root, a.file), 'utf8');
    const body = text.replace(/\]\((?!https?:|#|\.\.\/)([^)]+\.md(?:#[^)]*)?)\)/g, ']\(../docs/$1)');
    const targets = a.targets.map(t => {
      const target = links.links.find(l => l.article === a.id && l.site === t.site && l.canonical === t.url);
      return `[${t.label}](${target.url})`;
    }).join(' · ');
    const footer = targets ? `\n\n---\n\n相关资料：${targets}。链接指向我们运营的网站；商品、支付和交付条件以实际页面为准。` : '';
    outputs.set(`articles/${a.id}.md`, `> 本文是[主稿](${a.canonical})的稳定归档，由 PayForGPT 与 Nano Banana 内容运营方维护。原稿发表：${a.publishedAt}；复核：${a.reviewedAt}。修订原稿后同步本文件，不按日期重复增加文章数。\n\n${body.trim()}${footer}\n`);
  }
  const changes = [...outputs].filter(([file, content]) => !fs.existsSync(path.join(root, file)) || fs.readFileSync(path.join(root, file), 'utf8') !== content);
  return { outputs, changes, primaryArticles: catalog.articles.length };
}

export function writePlan(plan, root = ROOT) {
  for (const [relative, text] of plan.changes) {
    const out = path.resolve(root, relative), parent = path.dirname(out);
    fs.mkdirSync(parent, { recursive: true });
    if (!fs.realpathSync(parent).startsWith(fs.realpathSync(root) + path.sep) && parent !== root) throw new Error('Output parent escapes repository');
    if (fs.existsSync(out) && fs.lstatSync(out).isSymbolicLink()) throw new Error('Symlink output refused');
    const temporary = `${out}.tmp`;
    fs.writeFileSync(temporary, text, { flag: 'wx' });
    fs.renameSync(temporary, out);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.some(a => !['--write', '--check'].includes(a)) || (args.includes('--write') && args.includes('--check'))) throw new Error('Use no flags (preview), --write, or --check');
    const plan = planSync();
    if (args.includes('--write')) writePlan(plan);
    console.log(JSON.stringify({ mode: args.includes('--write') ? 'write' : args.includes('--check') ? 'check' : 'preview', primaryArticles: plan.primaryArticles, changedFiles: plan.changes.map(([file]) => file), gitOrRemoteWrites: false }));
    if (args.includes('--check') && plan.changes.length) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
