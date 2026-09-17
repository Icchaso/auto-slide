/* =====================================================================
   型エンジンの PPTX 書き出し（build.mjs --pptx から呼ぶ）
   ---------------------------------------------------------------------
   やり方: 描画済みのHTMLから
     ① 文字だけを透明にしたスクリーンショット → スライドの背景画像
     ② 文字は「画面に出ている行の区切り・位置・色・太さ」のまま → テキストボックス
   こうすると
     ・23型ぶんのPPTX用レイアウトを二重に書かなくてよい（HTMLと見た目が必ず一致）
     ・納品後にパワポ/Canvaで文字を直せる（文字は画像に焼き込まない）
   単位: 1920px = 13.333in、1px = 0.5pt
   ===================================================================== */
import pptxgen from 'pptxgenjs';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const PX_IN = 13.333 / 1920;

/* ブラウザ内で実行: 文字の塊ごとに「行 → 色・太さの揃った区間」を取り出す */
function extractText() {
  const slide = document.querySelector('.slide');
  const origin = slide.getBoundingClientRect();
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgba = c => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const hex = ([r, g, b]) => [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();

  const isBlock = el => !getComputedStyle(el).display.startsWith('inline') || el === slide;
  const blockOf = node => { let e = node.parentElement; while (e && !isBlock(e)) e = e.parentElement; return e; };
  const hidden = el => { for (let e = el; e && e !== slide; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return true; } return false; };

  // 文字ノードを塊（最寄りのブロック要素）ごとに集める。装飾（.deco）は背景に残す
  const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
  const groups = new Map();
  for (let n; (n = walker.nextNode());) {
    if (!n.data.trim() && !n.data.includes(' ')) continue;
    const p = n.parentElement;
    if (!p || p.closest('.deco, svg, script, style') || hidden(p)) continue;
    const b = blockOf(n);
    if (!groups.has(b)) groups.set(b, []);
    groups.get(b).push(n);
  }

  const boxes = [];
  const range = document.createRange();
  for (const [block, nodes] of groups) {
    const bcs = getComputedStyle(block);
    const lines = [];   // { top, bottom, left, right, runs: [{text, style}] }
    let cur = null;
    for (const node of nodes) {
      const el = node.parentElement, cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      const [r, g, b, a] = rgba(cs.color);
      const upper = cs.textTransform === 'uppercase';
      const deco = (cs.textDecorationLine || '');
      const style = { color: hex([r, g, b]), alpha: a, fs, bold: +cs.fontWeight >= 600,
        face: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
        spacing: parseFloat(cs.letterSpacing) || 0,
        underline: deco.includes('underline'), strike: deco.includes('line-through') };
      const text = node.data.replace(/\s+/g, ' ');
      for (let i = 0; i < node.data.length; i++) {
        range.setStart(node, i); range.setEnd(node, i + 1);
        const rect = [...range.getClientRects()].find(q => q.width > 0 || q.height > 0);
        if (!rect) continue;
        let ch = text[i] ?? node.data[i];
        if (/\s/.test(node.data[i])) ch = ' ';
        if (upper) ch = ch.toUpperCase();
        const top = rect.top - origin.top, left = rect.left - origin.left;
        const newLine = !cur || top > cur.bottom - Math.min(rect.height, cur.bottom - cur.top) * 0.4;
        if (newLine) { cur = { top, bottom: top + rect.height, left, right: left + rect.width, runs: [] }; lines.push(cur); if (ch === ' ') continue; }
        cur.top = Math.min(cur.top, top); cur.bottom = Math.max(cur.bottom, top + rect.height);
        cur.left = Math.min(cur.left, left); cur.right = Math.max(cur.right, left + rect.width);
        const last = cur.runs[cur.runs.length - 1];
        if (last && JSON.stringify(last.style) === JSON.stringify(style)) last.text += ch;
        else cur.runs.push({ text: ch, style });
      }
    }
    // 行末の空白を落とす
    for (const ln of lines) { const lr = ln.runs[ln.runs.length - 1]; if (lr) lr.text = lr.text.replace(/\s+$/, ''); ln.runs = ln.runs.filter(r => r.text); }
    const real = lines.filter(l => l.runs.length);
    if (!real.length) continue;
    const align = ['center', '-webkit-center'].includes(bcs.textAlign) ? 'center' : (bcs.textAlign === 'right' || bcs.textAlign === 'end') ? 'right' : 'left';
    const lhRaw = parseFloat(bcs.lineHeight);
    const maxFs = Math.max(...real.flatMap(l => l.runs.map(r => r.style.fs)));
    const lineH = Number.isFinite(lhRaw) ? lhRaw : maxFs * 1.3;
    boxes.push({ align, lineH, maxFs, lines: real.map(l => ({ top: l.top, bottom: l.bottom, left: l.left, right: l.right, runs: l.runs })) });
  }
  return boxes;
}

/* 文字だけ透明にする（アイコンの線は currentColor なので color は触らない） */
const HIDE_TEXT = `
  .slide *:not(.deco):not(.deco *) { -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; text-shadow: none !important; }
  .slide .deco, .slide .deco * { -webkit-text-fill-color: initial !important; }`;

export async function exportPptx({ page, htmlUrls, deck, outPath, bgDir }) {
  mkdirSync(bgDir, { recursive: true });
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';   // 13.333 × 7.5 in
  pres.title = deck.title || deck.slides[0]?.title?.replace(/\*|\\n/g, '') || 'slides';

  for (let i = 0; i < htmlUrls.length; i++) {
    await page.goto(htmlUrls[i], { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const boxes = await page.evaluate(extractText);
    await page.addStyleTag({ content: HIDE_TEXT });
    await page.waitForTimeout(80);
    const bg = join(bgDir, `bg-${String(i + 1).padStart(2, '0')}.png`);
    await page.screenshot({ path: bg });

    const slide = pres.addSlide();
    slide.background = { path: bg };
    for (const b of boxes) {
      const top = b.lines[0].top, bottom = b.lines[b.lines.length - 1].bottom;
      const left = Math.min(...b.lines.map(l => l.left)), right = Math.max(...b.lines.map(l => l.right));
      const lineH = b.lines.length > 1 ? (b.lines[b.lines.length - 1].top - b.lines[0].top) / (b.lines.length - 1) : Math.max(b.lineH, bottom - top);
      // PowerPoint は字形の幅がわずかに違うので、左右に余裕を持たせ折り返しは画面の行区切りで固定する
      const padX = Math.max(8, (right - left) * 0.06);
      const x = b.align === 'center' ? left - padX / 2 : b.align === 'right' ? left - padX : left;
      const runs = [];
      b.lines.forEach((ln, li) => ln.runs.forEach((r, ri) => {
        const s = r.style;
        runs.push({ text: r.text, options: {
          color: s.color, transparency: s.alpha < 1 ? Math.round((1 - s.alpha) * 100) : undefined,
          fontSize: +(s.fs * 0.5).toFixed(1), bold: s.bold, fontFace: s.face,
          charSpacing: s.spacing ? +(s.spacing * 0.5).toFixed(1) : undefined,
          underline: s.underline ? { style: 'sng' } : undefined, strike: s.strike ? 'sngStrike' : undefined,
          breakLine: ri === ln.runs.length - 1 && li < b.lines.length - 1,
        } });
      }));
      const yPad = (lineH - (b.lines[0].bottom - b.lines[0].top)) / 2;
      slide.addText(runs, {
        x: x * PX_IN, y: (top - Math.max(yPad, 0)) * PX_IN,
        w: (right - left + padX) * PX_IN, h: Math.max(lineH * b.lines.length, bottom - top) * PX_IN,
        margin: 0, valign: 'top', align: b.align, wrap: false, fit: 'none',
        lineSpacing: +(lineH * 0.5).toFixed(1), paraSpaceBefore: 0, paraSpaceAfter: 0,
      });
    }
    const notes = deck.slides[i]?.notes;
    if (notes) slide.addNotes(notes);
  }
  await pres.writeFile({ fileName: outPath });
  return outPath;
}
