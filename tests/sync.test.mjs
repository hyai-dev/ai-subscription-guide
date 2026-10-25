import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, localFile, loadCatalog, trackedUrl } from '../tools/catalog.mjs';
import { replaceSection, planSync, writePlan } from '../tools/sync.mjs';

test('topic attribution stays on the selected site and uses fields the sites preserve', () => {
  const u = new URL(trackedUrl('nano', 'https://nano-banana.lol/faq#orders', 'codex-first-task'));
  assert.equal(u.searchParams.get('utm_campaign'), 'ai_subscription_guide_codex_first_task_nano');
  assert.equal(u.searchParams.get('utm_source'), 'github');
  assert.equal(u.searchParams.get('utm_medium'), 'referral');
  assert.equal(u.searchParams.has('utm_content'), false);
  assert.equal(u.hash, '#orders');
  assert.throws(() => trackedUrl('nano', 'https://example.com/faq', 'codex'));
  assert.throws(() => trackedUrl('nano', 'https://nano-banana.lol@evil.example/faq', 'codex'));
  assert.throws(() => trackedUrl('unknown', 'https://nano-banana.lol/faq', 'codex'));
});

test('README generation refuses missing, duplicate or inverted markers', () => {
  assert.throws(() => replaceSection('content', 'LATEST', 'new'));
  assert.throws(() => replaceSection('<!-- END LATEST --><!-- BEGIN LATEST -->', 'LATEST', 'new'));
  assert.throws(() => replaceSection('<!-- BEGIN LATEST --><!-- BEGIN LATEST --><!-- END LATEST -->', 'LATEST', 'new'));
  assert.equal(replaceSection('a<!-- BEGIN LATEST -->old<!-- END LATEST -->z', 'LATEST', 'new'), 'a<!-- BEGIN LATEST -->\nnew\n<!-- END LATEST -->z');
});

test('repository paths reject traversal and symlink escape', () => {
  assert.throws(() => localFile('../outside.md'));
  assert.throws(() => localFile('/absolute.md'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-path-'));
  try {
    fs.symlinkSync(path.join(ROOT, 'README.md'), path.join(tmp, 'escape.md'));
    assert.throws(() => localFile('escape.md', tmp));
  } finally { fs.rmSync(tmp, { recursive: true }); }
});

test('real manifest produces stable single archives and an idempotent preview', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-sync-'));
  try {
    for (const entry of ['README.md', 'content', 'docs', 'assets']) fs.cpSync(path.join(ROOT, entry), path.join(root, entry), { recursive: true });
    const manifest = loadCatalog(root);
    const first = planSync(root);
    assert.equal([...first.outputs.keys()].filter(f => f.startsWith('articles/')).length, manifest.articles.length);
    const oldReadme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), oldReadme);
    writePlan(first, root);
    assert.equal(planSync(root).changes.length, 0);
    for (const a of manifest.articles) assert.ok(fs.readFileSync(path.join(root, `articles/${a.id}.md`), 'utf8').includes(a.canonical));
  } finally { fs.rmSync(root, { recursive: true }); }
});

test('query ownership rejects duplicates and Markdown structures before README generation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-query-'));
  try {
    for (const entry of ['README.md', 'content', 'docs', 'assets']) fs.cpSync(path.join(ROOT, entry), path.join(root, entry), { recursive: true });
    const manifestPath = path.join(root, 'content/publication-manifest.json');
    const baseline = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const tryMutation = mutate => {
      const changed = structuredClone(baseline); mutate(changed);
      fs.writeFileSync(manifestPath, JSON.stringify(changed));
      assert.throws(() => planSync(root));
    };
    tryMutation(m => { m.articles[1].primaryQuery = m.articles[0].primaryQuery.toUpperCase(); });
    for (const text of ['](https://example.com)', '[label]', 'a\\b', '| table |', 'line\nbreak', '<img>', '`code`']) {
      tryMutation(m => { m.articles[0].primaryQuery = text; });
      tryMutation(m => { m.articles[0].cluster = text; });
      tryMutation(m => { m.articles[0].secondaryQueries = [text]; });
    }
    fs.writeFileSync(manifestPath, JSON.stringify(baseline));
    assert.equal(loadCatalog(root).articles.length, baseline.articles.length);
  } finally { fs.rmSync(root, { recursive: true }); }
});

// Actual edited publications need labels that survive the sites' <=32-character filter.
test('reviewed Codex and risk publications use unique bounded campaign labels', () => {
  const labels = new Set();
  for (const [topic, prefix] of [['codex-access', 'codex_check'], ['account-risk-claims', 'risk_check']]) {
    for (const site of ['nano', 'payforgpt']) {
      const origin = site === 'nano' ? 'https://nano-banana.lol' : 'https://payforgpt.com';
      const u = new URL(trackedUrl(site, origin + '/blog/is-chatgpt-plus-recharge-safe#checks', topic));
      const label = u.searchParams.get('utm_campaign');
      assert.equal(label, `${prefix}_${site}`);
      assert.ok(label.length <= 32 && /^[a-z0-9_]+$/.test(label));
      assert.equal(u.origin, origin);
      assert.equal(u.pathname, '/blog/is-chatgpt-plus-recharge-safe');
      assert.equal(u.hash, '#checks');
      assert.equal(u.searchParams.get('utm_source'), 'github');
      assert.equal(u.searchParams.get('utm_medium'), 'referral');
      assert.ok(!labels.has(label)); labels.add(label);
    }
  }
  assert.equal(labels.size, 4);
  assert.equal(new URL(trackedUrl('nano', 'https://nano-banana.lol/faq', 'billing-ledgers')).searchParams.get('utm_campaign'), 'ai_subscription_guide_billing_ledgers_nano');
  assert.throws(() => trackedUrl('nano', 'https://example.com/faq', 'codex-access'));
  assert.throws(() => trackedUrl('nano', 'https://nano-banana.lol/faq', 'account-risk-claims?x=1'));
});
