/* =====================================================================
   deck.json の事前チェック（描画する前に、中身と構成の違反を止める）
   エラー文は「どのスライドの・どの枠を・どう直すか」まで書く。
   安いモデルはこの文をそのまま読んで直せるようにする。
   ===================================================================== */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { LAYOUTS, LAYOUT_IDS } from './layouts.mjs';
import { width, titleProblem, plain } from './text.mjs';

const CARDISH = new Set(['features']);
const NON_BODY = new Set(['cover', 'agenda', 'section', 'message', 'closing', 'photo', 'question', 'quote']);
const VISUAL = new Set(['big-number', 'compare', 'flow', 'timeline', 'screenshot', 'bars', 'table', 'pyramid', 'matrix', 'funnel', 'stats']);

export function validateDeck(deck, deckDir, root) {
  const errors = [], warns = [];
  const E = (where, msg, fix) => errors.push({ where, msg, fix });
  const Wn = (where, msg, fix) => warns.push({ where, msg, fix });

  if (!deck || !Array.isArray(deck.slides) || !deck.slides.length) { E('deck', 'slides が空', 'reference/examples/ の deck.json を真似て slides を書く'); return { errors, warns }; }
  if (!deck.theme || !existsSync(join(root, 'themes', `${deck.theme}.css`))) E('deck.theme', `テーマ「${deck.theme}」が無い`, 'themes/ にあるテーマ名（corporate / fresh / pop / tech など）を書く');

  if (deck.video !== undefined && typeof deck.video !== 'boolean') E('deck.video', `video は true / false で書く（今: ${JSON.stringify(deck.video)}）`, '動画に使うスライドなら "video": true、それ以外は書かない');

  const slides = deck.slides;
  slides.forEach((s, i) => {
    const id = `${String(i + 1).padStart(2, '0')}（${s.layout || '型なし'}）`;
    const L = LAYOUTS[s.layout];
    if (!L) { E(id, `型「${s.layout}」は存在しない`, `使える型: ${LAYOUT_IDS.join(' / ')}（reference/layouts.md の決定表から選ぶ）`); return; }

    // 枠の検査
    const walk = (spec, val, path) => {
      const missing = val === undefined || val === null || val === '' || (Array.isArray(val) && !val.length && spec.min > 0);
      if (missing) { if (spec.req) E(`${id} ${path}`, '必須の枠が空', spec.hint ? `入れる: ${spec.hint}` : '中身を入れる'); return; }
      switch (spec.kind) {
        case 'text': {
          if (typeof val !== 'string') { E(`${id} ${path}`, '文字で書く必要がある', '"…" で囲む'); return; }
          const w = width(val);
          if (w > spec.max) E(`${id} ${path}`, `${w}字（上限${spec.max}字）:「${plain(val).slice(0, 24)}…」`, `${Math.ceil(w - spec.max)}字以上削る。削れないなら項目や枚数を分ける`);
          else if (w < spec.min) E(`${id} ${path}`, `${w}字（${spec.min}字以上）`, '具体的な言葉を足す');
          if ((val.match(/\*/g) || []).length % 2) E(`${id} ${path}`, '強調記号 * が閉じていない', '*強調したい語* の形にする');
          break;
        }
        case 'list':
          if (!Array.isArray(val)) { E(`${id} ${path}`, '配列 [...] で書く必要がある', '[ ] で囲む'); return; }
          if (val.length > spec.max) E(`${id} ${path}`, `${val.length}個（上限${spec.max}個）`, `${val.length - spec.max}個減らすか、2枚に分ける`);
          if (val.length < spec.min) E(`${id} ${path}`, `${val.length}個（${spec.min}個以上）`, spec.min > 1 ? '項目を足すか、別の型にする' : '項目を足す');
          val.forEach((v, k) => walk(spec.item, v, `${path}[${k + 1}]`));
          break;
        case 'obj':
          if (typeof val !== 'object') { E(`${id} ${path}`, '{ } で書く必要がある', '{ "label": … } の形にする'); return; }
          for (const [k, sp] of Object.entries(spec.fields)) walk(sp, val[k], path ? `${path}.${k}` : k);
          for (const k of Object.keys(val)) if (!spec.fields[k]) Wn(`${id} ${path}.${k}`, `この枠「${k}」は使われない`, '消す');
          break;
        case 'enum':
          if (!spec.values.includes(val)) E(`${id} ${path}`, `「${val}」は選べない`, `次から選ぶ: ${spec.values.join(' / ')}`);
          break;
        case 'num':
          if (typeof val !== 'number' || val < spec.min || val > spec.max) E(`${id} ${path}`, `数値 ${spec.min}〜${spec.max} で書く`, '引用符なしの数字にする');
          break;
        case 'img':
          if (typeof val !== 'string' || !existsSync(join(deckDir, val))) E(`${id} ${path}`, `画像ファイルが無い: ${val}`, 'assets/ に実物の画像を置く。無いなら画像を使わない型に変える（空の枠は禁止）');
          break;
      }
    };
    walk({ kind: 'obj', fields: { layout: { kind: 'text', max: 20, min: 0, req: true }, notes: { kind: 'text', max: 2000, min: 0, req: false }, ...L.spec } }, s, '');

    // 見出しの文末
    for (const key of ['title', 'message']) {
      if (L.spec[key] && s[key]) { const p = titleProblem(s[key]); if (p) E(`${id} ${key}`, p, '例:「迷ったものだけを原本と見比べる」「会計ソフトの数字を正にする」'); }
    }
    // 中身の無いグラフ（比率を満たすための水増し）を止める
    if (s.layout === 'bars' && Array.isArray(s.items)) {
      const vals = s.items.map(it => it?.value).filter(v => typeof v === 'number');
      if (vals.length >= 2 && new Set(vals).size === 1) E(`${id} items`, `棒の値が全部同じ（${vals[0]}）で、比べる意味が無い`, '台本に比べる数字が無いなら bars を使わない。項目の列挙なら checklist / problem、手順なら flow にする（図解の割合のために中身の無い図を作らない）');
    }
    // 表の列数とセル数がそろっているか
    if (s.layout === 'table' && Array.isArray(s.columns) && Array.isArray(s.rows))
      s.rows.forEach((r, k) => { if (Array.isArray(r.cells) && r.cells.length !== s.columns.length) E(`${id} rows[${k + 1}].cells`, `${r.cells.length}個（columns は${s.columns.length}個）`, 'columns と同じ個数にする。該当しないセルは「—」'); });
    // 強調番号・現在地が範囲内か
    const list = s.items || s.steps || s.layers || s.stages || s.plans || s.cells || s.columns || s.members;
    for (const key of ['highlight', 'now', 'recommend']) if (typeof s[key] === 'number' && list && s[key] > list.length) E(`${id} ${key}`, `${s[key]}番目は存在しない（${list.length}個）`, `1〜${list.length} にする`);
  });

  /* ---------- デッキ全体の構成 ---------- */
  const L = slides.map(s => s.layout);
  if (L[0] !== 'cover') E('構成', '1枚目が表紙（cover）ではない', 'slides の先頭に cover を置く');
  if (L[L.length - 1] !== 'closing') E('構成', '最後が締め（closing）ではない', 'slides の最後に closing を置く');
  if (slides.length > 5 && L[1] !== 'agenda') Wn('構成', '6枚以上なのに2枚目が目次（agenda）ではない', '2枚目に agenda を置く');
  let run = 1;
  for (let i = 1; i < L.length; i++) {
    run = L[i] === L[i - 1] ? run + 1 : 1;
    if (run === 3) E(`構成 ${i - 1}〜${i + 1}枚目`, `同じ型「${L[i]}」が3枚連続`, '真ん中を別の型にする（決定表の「単調になったら」列を見る）');
  }
  // 章扉の直後に中身が無い（章扉が続く・章扉のすぐ後が締め）
  for (let i = 0; i < L.length; i++) if (L[i] === 'section' && (i === L.length - 1 || ['section', 'closing'].includes(L[i + 1])))
    E(`構成 ${i + 1}枚目`, `章扉「${plain(slides[i].title || '')}」の後に中身のスライドが無い`, '章の中身を1枚以上入れる。台本に中身が無い章なら、その章扉と目次の項目を消す');
  const body = L.filter(x => !NON_BODY.has(x));
  if (body.length >= 3) {
    const card = body.filter(x => CARDISH.has(x)).length / body.length;
    if (card > 0.5) E('構成', `カード並べ系（features）が本文の${Math.round(card * 100)}%`, '比較（compare）・手順（flow）・巨大数字（big-number）に振り替える');
    else if (card > 0.25) Wn('構成', `カード並べ系（features）が本文の${Math.round(card * 100)}%（目安25%以下）`, '1枚を図解の型に振り替える');
    const vis = body.filter(x => VISUAL.has(x)).length / body.length;
    if (vis < 0.4) E('構成', `図解の型が本文の${Math.round(vis * 100)}%（最低40%）`, '数字→big-number／bars、前後の違い→compare、観点の多い比較→table、順番→flow、時期→timeline、段階の絞り込み→funnel、階層→pyramid、分類→matrix に振り替える');
    else if (vis < 0.6) Wn('構成', `図解の型が本文の${Math.round(vis * 100)}%（目標60%以上）`, 'あと1枚を図解の型にする');
  }
  const darkCount = L.filter(x => LAYOUTS[x]?.tone === 'dark').length;
  if (slides.length >= 8 && darkCount < 2) Wn('構成', `暗い面の枚が${darkCount}枚（明暗のリズムが弱い）`, '章の区切りに section、山場に message を入れる');

  // 目次と章扉の言葉が一致しているか
  const agenda = slides.find(s => s.layout === 'agenda');
  const sections = slides.filter(s => s.layout === 'section');
  if (agenda && sections.length) {
    const titles = agenda.items?.map(it => plain(it.title)) || [];
    sections.forEach(sec => { if (!titles.includes(plain(sec.title))) Wn('構成', `章扉「${plain(sec.title)}」が目次の項目と一致しない`, '目次と同じ言葉にそろえる'); });
  }
  return { errors, warns };
}
