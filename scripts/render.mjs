#!/usr/bin/env node
/* =====================================================================
   SlideSmith renderer — HTML スライドを 4K PNG / PDF に一括書き出し
   使い方:
     node scripts/render.mjs <deckDir>            # PNG のみ
     node scripts/render.mjs <deckDir> --pdf      # PNG + 結合PDF
     node scripts/render.mjs <deckDir> --scale=2  # 解像度倍率 (既定2 = 3840x2160)
   仕様:
     ・<deckDir> 内の *.html をファイル名順にレンダリング → <deckDir>/out/*.png
     ・レンダリング後に自動QC（キャンバスからのはみ出し / カード内の文字あふれ）
     ・QC違反があれば終了コード1 + 詳細を表示（=修正が必要な箇所が機械的に分かる）
   ===================================================================== */
import { chromium } from 'playwright-core';
import { readdirSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';

const argv = process.argv.slice(2);
const deckDir = resolve(argv.find(a => !a.startsWith('--')) ?? '.');
const wantPdf = argv.includes('--pdf');
const scale = Number((argv.find(a => a.startsWith('--scale=')) ?? '--scale=2').split('=')[1]);

const files = readdirSync(deckDir).filter(f => f.endsWith('.html')).sort();
if (files.length === 0) { console.error(`no .html files in ${deckDir}`); process.exit(1); }

const outDir = join(deckDir, 'out');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });

const issues = [];
const pngs = [];

for (const f of files) {
  await page.goto('file://' + join(deckDir, f), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);

  /* ---- 自動QC ---- */
  const probs = await page.evaluate(() => {
    const out = [];
    const W = 1920, H = 1080, TOL = 3;
    const slide = document.querySelector('.slide');
    if (!slide) { out.push('.slide 要素がない'); return out; }

    const label = el => {
      const cls = (el.className && typeof el.className === 'string') ? '.' + el.className.trim().split(/\s+/).join('.') : '';
      const txt = (el.textContent || '').trim().slice(0, 24);
      return `<${el.tagName.toLowerCase()}${cls}> "${txt}"`;
    };

    for (const el of slide.querySelectorAll('*')) {
      if (el.closest('.deco')) continue;                     // 装飾は意図的なはみ出しOK
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (!hasText) continue;
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      if (b.right > W + TOL || b.bottom > H + TOL || b.left < -TOL || b.top < -TOL)
        out.push(`キャンバス外にはみ出し: ${label(el)} (right=${Math.round(b.right)}, bottom=${Math.round(b.bottom)})`);
    }

    for (const box of slide.querySelectorAll('.card, .panel, .stat, .agenda li, .vlist li')) {
      const pb = box.getBoundingClientRect();
      for (const el of box.querySelectorAll('*')) {
        const b = el.getBoundingClientRect();
        if (b.bottom > pb.bottom + TOL)
          out.push(`ボックス内で文字あふれ: ${label(el)} in ${label(box)}`);
      }
    }
    return [...new Set(out)];
  });
  probs.forEach(p => issues.push(`${f} → ${p}`));

  const png = join(outDir, basename(f, '.html') + '.png');
  await page.screenshot({ path: png });
  pngs.push(png);
  console.log(`✓ ${f}${probs.length ? `  ⚠ QC ${probs.length}件` : ''}`);
}

/* ---- 結合PDF（スクリーンショットPNGを1枚=1ページで束ねる） ---- */
if (wantPdf) {
  const html = `<!doctype html><style>
    @page { size: 1920px 1080px; margin: 0; }
    body { margin: 0; }
    img { display: block; width: 1920px; height: 1080px; page-break-after: always; }
    img:last-child { page-break-after: auto; }
  </style>` + pngs.map(p => `<img src="file://${p}">`).join('');
  const tmp = join(outDir, '_pdf_tmp.html');
  writeFileSync(tmp, html);
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  await page.pdf({ path: join(outDir, 'deck.pdf'), width: '1920px', height: '1080px', printBackground: true, pageRanges: `1-${pngs.length}` });
  rmSync(tmp);
  console.log(`✓ deck.pdf (${pngs.length} pages)`);
}

await browser.close();

if (issues.length) {
  console.error(`\n⚠ QC違反 ${issues.length}件 — 出力はしましたが修正推奨:`);
  issues.forEach(i => console.error('  ' + i));
  process.exit(1);
}
console.log(`\nALL CLEAN — ${files.length}枚 / QC違反ゼロ`);
