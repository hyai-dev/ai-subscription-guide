import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { ROOT, localFile, loadCatalog } from './catalog.mjs';

try {
  const catalog = loadCatalog();
  const walk = relative => fs.readdirSync(path.join(ROOT, relative), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${relative}/${e.name}`) : e.name.endsWith('.md') ? [`${relative}/${e.name}`] : []);
  const files = ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md', 'CONTENT-LICENSE.md', ...walk('docs'), ...walk('articles'), ...walk('ops'), ...walk('assets'), ...walk('data')];
  let links = 0;
  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const m of source.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const href = m[1];
      if (/^https:\/\//.test(href) || href.startsWith('#')) continue;
      if (/^[a-z]+:/i.test(href)) throw new Error(`Unexpected URL scheme in ${file}`);
      const relative = path.posix.normalize(path.posix.join(path.posix.dirname(file), decodeURIComponent(href.split('#')[0])));
      localFile(relative);
      links++;
    }
    if (/\/Users\/|\/tmp\/|file:\/\/|-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----/.test(source)) throw new Error(`Private material pattern in ${file}`);
  }
  const example = spawnSync('python3', ['assets/practical-20261019/verify-sample-sales.py', 'assets/practical-20261019/sample-sales.csv'], { cwd: ROOT, encoding: 'utf8' });
  if (example.status !== 0) throw new Error('Synthetic CSV verification failed');
  assert.deepEqual(JSON.parse(example.stdout), JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/practical-20261019/sample-sales-expected.json'), 'utf8')));
  console.log(JSON.stringify({ articles: catalog.articles.length, checkedMarkdownFiles: files.length, localLinks: links, syntheticCsvRecalculation: 'pass', result: 'pass' }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
