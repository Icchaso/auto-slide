#!/usr/bin/env node
/* =====================================================================
   SlideSmith build — deck.json から完成スライドまでを1コマンドで
   使い方:
     node scripts/build.mjs decks/<案件>            # 事前チェック → HTML生成 → 4K PNG → 機械検品
     node scripts/build.mjs decks/<案件> --pdf      # ＋結合PDF
     node scripts/build.mjs decks/<案件> --pptx     # ＋編集できるPPTX（背景は画像・文字はテキストボックス）
     node scripts/build.mjs decks/<案件> --check    # 事前チェックだけ（描画しない・速い）
   出力:
     decks/<案件>/html/*.html      生成物（手で直さない。deck.json を直す）
     decks/<案件>/out/*.png        4K画像
     decks/<案件>/out/sheet.png    全枚の一覧（レビュー役に見せる）
     decks/<案件>/out/qc-report.json
   終了コード: 0=必須ゲート全合格 / 1=直す所がある
   ===================================================================== */
import { chromium } from 'playwright-core';
import { readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LAYOUTS } from '../engine/layouts.mjs';
import { validateDeck } from '../engine/validate.mjs';
import { esc } from '../engine/text.mjs';
import { checkSlide, checkDeck, summarize, printReport, W, H } from './qc.mjs';
import { exportPptx } from '../engine/pptx-export.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const argv = process.argv.slice(2);
const deckDir = resolve(argv.find(a => !a.startsWith('--')) ?? '.');
const wantPdf = argv.includes('--pdf');
const wantPptx = argv.includes('--pptx');
const checkOnly = argv.includes('--check');
const scale = Number((argv.find(a => a.startsWith('--scale=')) ?? '--scale=2').split('=')[1]);

const deckPath = join(deckDir, 'deck.json');
if (!existsSync(deckPath)) { console.error(`deck.json が無い: ${deckPath}`); process.exit(1); }
let deck;
try { deck = JSON.parse(readFileSync(deckPath, 'utf8')); }
catch (e) { console.error(`deck.json が JSON として読めない: ${e.message}\n  直し方: カンマの過不足・引用符の閉じ忘れを確認する`); process.exit(1); }

/* ---------- 1. 事前チェック ---------- */
const v = validateDeck(deck, deckDir, ROOT);
const fmt = i => `  ${i.where} → ${i.msg}\n      直し方: ${i.fix}`;
if (v.warns.length) { console.log(`△ 事前チェックの注意 ${v.warns.length}件`); v.warns.forEach(i => console.log(fmt(i))); }
if (v.errors.length) {
  console.error(`\n✖ 事前チェックで止まりました ${v.errors.length}件（deck.json を直して再実行）`);
  v.errors.forEach(i => console.error(fmt(i)));
  process.exit(1);
}
console.log(`✓ 事前チェック合格（${deck.slides.length}枚）`);
if (checkOnly) process.exit(0);

/* ---------- 2. HTML生成 ---------- */
const htmlDir = join(deckDir, 'html');
mkdirSync(htmlDir, { recursive: true });
for (const f of readdirSync(htmlDir)) if (f.endsWith('.html')) rmSync(join(htmlDir, f));   // 生成物だけの置き場なので作り直す

const css = p => pathToFileURL(join(ROOT, p)).href;
const sectionsTotal = deck.slides.filter(s => s.layout === 'section').length;
let sectionNo = 0;
const files = deck.slides.map((s, i) => {
  const L = LAYOUTS[s.layout];
  if (s.layout === 'section') sectionNo++;
  const ctx = { index: i, total: deck.slides.length, sectionNo, sectionsTotal,
    asset: p => pathToFileURL(join(deckDir, p)).href };
  const tone = L.tone === 'dark' ? ' x-dark' : '';
  const no = String(i + 1).padStart(2, '0');
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<link rel="stylesheet" href="${css('core/base.css')}">
<link rel="stylesheet" href="${css(`themes/${deck.theme}.css`)}">
<link rel="stylesheet" href="${css('core/engine.css')}">
</head><body>
<div class="slide x-slide${tone}${deck.video ? ' x-video' : ''}" data-layout="${s.layout}">
${L.render(s, ctx)}
  ${deck.brand && !deck.video ? `<div class="brand"><span class="mark"></span>${esc(deck.brand)}</div>` : ''}
  ${i > 0 && !deck.video ? `<div class="pageno">${no}</div>` : ''}
</div></body></html>`;
  const name = `${no}_${s.layout}.html`;
  writeFileSync(join(htmlDir, name), html);
  return name;
});

/* ---------- 3. 描画＋機械検品 ---------- */
const outDir = join(deckDir, 'out');
mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(outDir)) if (f.endsWith('.png')) rmSync(join(outDir, f));   // 前回の画像が残って混ざらないように

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: scale });
const results = [], pngs = [];
for (const f of files) {
  await page.goto(pathToFileURL(join(htmlDir, f)).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const r = await checkSlide(page);
  results.push({ file: f, ...r });
  const png = join(outDir, f.replace('.html', '.png'));
  await page.screenshot({ path: png });
  pngs.push(png);
  const e = r.issues.filter(i => i.sev === 'error').length, w = r.issues.length - e;
  console.log(`${e ? '✖' : '✓'} ${f}${e ? `  必須違反${e}` : ''}${w ? `  減点${w}` : ''}`);
}

/* 一覧画像（レビュー役がデッキ全体のリズムを見る用） */
const cols = 4, tw = 640, th = 360, gap = 16;
const rows = Math.ceil(pngs.length / cols);
const sheetHtml = `<!doctype html><style>body{margin:0;background:#8a8f98;width:${cols * (tw + gap) + gap}px}
  .g{display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:${gap}px;padding:${gap}px}
  figure{margin:0;position:relative}img{width:${tw}px;height:${th}px;display:block}
  figcaption{position:absolute;left:8px;top:8px;background:#000c;color:#fff;font:700 18px sans-serif;padding:2px 8px;border-radius:4px}</style>
  <div class="g">${pngs.map((p, i) => `<figure><img src="${pathToFileURL(p).href}"><figcaption>${String(i + 1).padStart(2, '0')}</figcaption></figure>`).join('')}</div>`;
const sheetTmp = join(outDir, '_sheet.html');
writeFileSync(sheetTmp, sheetHtml);
const sp = await browser.newPage({ viewport: { width: cols * (tw + gap) + gap, height: rows * (th + gap) + gap }, deviceScaleFactor: 1 });
await sp.goto(pathToFileURL(sheetTmp).href, { waitUntil: 'load' });
await sp.screenshot({ path: join(outDir, 'sheet.png'), fullPage: true });
rmSync(sheetTmp);

if (wantPdf) {
  const tmp = join(outDir, '_pdf.html');
  writeFileSync(tmp, `<!doctype html><style>@page{size:1920px 1080px;margin:0}body{margin:0}img{display:block;width:1920px;height:1080px;page-break-after:always}img:last-child{page-break-after:auto}</style>` + pngs.map(p => `<img src="${pathToFileURL(p).href}">`).join(''));
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await page.pdf({ path: join(outDir, 'deck.pdf'), width: '1920px', height: '1080px', printBackground: true });
  rmSync(tmp);
  console.log('✓ deck.pdf');
}
if (wantPptx) {
  const name = `${deckDir.split('/').pop()}.pptx`;
  await exportPptx({ page, deck, outPath: join(outDir, name), bgDir: join(outDir, 'pptx-bg'),
    htmlUrls: files.map(f => pathToFileURL(join(htmlDir, f)).href) });
  console.log(`✓ ${name}（確認: node scripts/pptx-preview.mjs ${relative(process.cwd(), join(outDir, name))}）`);
}
await browser.close();

const deckIssues = checkDeck(results);
const rep = summarize(results, deckIssues);
writeFileSync(join(outDir, 'qc-report.json'), JSON.stringify({ pass: rep.pass, errors: rep.errors, warns: rep.warns,
  slides: results.map(r => ({ file: r.file, meta: r.meta })) }, null, 2));
printReport(rep);
console.log(`\n出力: ${relative(process.cwd(), outDir)}/（一覧は sheet.png）`);
process.exit(rep.pass ? 0 : 1);
