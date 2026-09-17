/* =====================================================================
   SlideSmith engine — 型（レイアウト）の定義
   ---------------------------------------------------------------------
   1つの型 = 「枠（入れてよい中身と文字数の上限）」＋「HTMLの組み方」
   ・AI（どのモデルでも）が決めるのは「型の選択」と「枠に入れる言葉」だけ
   ・座標・サイズ・色はここと core/engine.css が決める（AIは触らない）
   ・枠の文字数は全角=1・半角=0.5 で数える（engine/text.mjs の width）
   新しい型を足すときは reference/layouts.md の決定表にも追記すること
   ===================================================================== */
import { esc, rich } from './text.mjs';
import { icon, ICON_NAMES } from './icons.mjs';

/* ---------- 枠の書き方（validate.mjs が読む） ---------- */
export const T = (max, o = {}) => ({ kind: 'text', max, min: o.min ?? 0, req: o.req ?? true, hint: o.hint });
export const OPT = (max, o = {}) => T(max, { ...o, req: false });
export const LIST = (item, min, max, o = {}) => ({ kind: 'list', item, min, max, req: o.req ?? true, hint: o.hint });
export const OBJ = (fields, o = {}) => ({ kind: 'obj', fields, req: o.req ?? true });
export const ENUM = (values, o = {}) => ({ kind: 'enum', values, req: o.req ?? false });
export const NUM = (o = {}) => ({ kind: 'num', min: o.min ?? 0, max: o.max ?? 99, req: o.req ?? false });
export const IMG = (o = {}) => ({ kind: 'img', req: o.req ?? true });
const ICON = (o = {}) => ENUM(ICON_NAMES, o);

/* ---------- 共通パーツ ---------- */
const head = (s, o = {}) => `
  <header class="x-head${o.center ? ' is-center' : ''}">
    ${s.kicker ? `<div class="x-kicker">${esc(s.kicker)}</div>` : ''}
    <h2 class="x-title" data-slot="title">${rich(s.title)}</h2>
    ${s.lead ? `<p class="x-lead" data-slot="lead">${rich(s.lead)}</p>` : ''}
  </header>`;

const pad2 = n => String(n).padStart(2, '0');

/* 数字と単位を分けて、単位を小さく組む（例: "1,000枚" → 1,000 + 枚） */
const numUnit = (value, unit) => {
  if (unit) return `<span class="x-n">${esc(value)}</span><span class="x-u">${esc(unit)}</span>`;
  const m = String(value).match(/^([+\-−±]?[\d.,]+)(.*)$/);
  return m ? `<span class="x-n">${esc(m[1])}</span>${m[2] ? `<span class="x-u">${esc(m[2])}</span>` : ''}`
           : `<span class="x-n is-word">${esc(value)}</span>`;
};

/* =====================================================================
   型の一覧
   ===================================================================== */
export const LAYOUTS = {

  /* ------------------------------------------------------------------ */
  cover: {
    name: '表紙', family: 'frame', tone: 'light',
    use: 'デッキの1枚目。何の資料で、相手に何の得があるか',
    spec: { kicker: OPT(24), title: T(30, { min: 6, hint: '相手の得が読めるタイトル。2行以内' }), subtitle: OPT(70),
            meta: OPT(30, { hint: '例: 2026.09 ご説明資料' }), image: IMG({ req: false }),
            mark: OPT(4, { hint: '画像が無いときの透かし文字（例: AI）' }), icon: ICON() },
    render: (s, c) => `
      <div class="deco x-dots"></div>
      <div class="deco x-orb x-orb-a"></div><div class="deco x-orb x-orb-b"></div>
      <div class="x-cover">
        <div class="x-cover-copy">
          ${s.meta ? `<div class="x-meta">${esc(s.meta)}</div>` : ''}
          ${s.kicker ? `<div class="x-kicker">${esc(s.kicker)}</div>` : ''}
          <h1 class="x-cover-title" data-slot="title">${rich(s.title)}</h1>
          <div class="x-rule"></div>
          ${s.subtitle ? `<p class="x-cover-sub" data-slot="subtitle">${rich(s.subtitle)}</p>` : ''}
        </div>
        <div class="x-cover-visual">
          ${s.image
            ? `<div class="x-photo" data-visual><img src="${esc(c.asset(s.image))}" alt=""></div><div class="deco x-photo-frame"></div>`
            : `<div class="deco x-mark">${esc(s.mark || 'AI')}</div>
               <div class="x-emblem" data-visual>${icon(s.icon || 'rocket', 250)}</div>`}
        </div>
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  agenda: {
    name: '目次', family: 'frame', tone: 'light',
    use: '5枚を超えるデッキの2枚目。章は3〜6個',
    spec: { kicker: OPT(20), title: T(24), items: LIST(OBJ({ title: T(16), desc: OPT(30) }), 3, 6) },
    render: s => {
      const two = s.items.length > 3;
      return `
      <div class="deco x-dots"></div>
      <div class="deco x-ghost-word">INDEX</div>
      ${head(s)}
      <div class="x-body x-agenda${two ? ' is-two' : ''}" style="--rows:${two ? Math.ceil(s.items.length / 2) : s.items.length}">
        ${s.items.map((it, i) => `
          <div class="x-agenda-item">
            <div class="x-agenda-no">${pad2(i + 1)}</div>
            <div class="x-agenda-text">
              <div class="x-agenda-title">${rich(it.title)}</div>
              ${it.desc ? `<div class="x-agenda-desc">${rich(it.desc)}</div>` : ''}
            </div>
          </div>`).join('')}
      </div>`;
    },
  },

  /* ------------------------------------------------------------------ */
  section: {
    name: '章扉', family: 'frame', tone: 'dark',
    use: '章の切り替わり。目次の章名と同じ言葉にする',
    spec: { title: T(20), lead: OPT(50) },
    render: (s, c) => `
      <div class="deco x-section-num">${pad2(c.sectionNo)}</div>
      <div class="deco x-grid-lines"></div>
      <div class="x-section">
        <div class="x-kicker">SECTION ${pad2(c.sectionNo)}</div>
        <h2 class="x-section-title" data-slot="title">${rich(s.title)}</h2>
        <div class="x-rule"></div>
        ${s.lead ? `<p class="x-section-lead">${rich(s.lead)}</p>` : ''}
        <div class="x-progress">${Array.from({ length: c.sectionsTotal }, (_, i) =>
          `<span class="${i + 1 === c.sectionNo ? 'is-on' : ''}">${pad2(i + 1)}</span>`).join('')}</div>
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  problem: {
    name: '課題提起', family: 'text', tone: 'light',
    use: '「困っていること」「なぜ難しいか」を2〜4個。数字か具体場面を入れる',
    spec: { kicker: OPT(24), title: T(28), lead: OPT(56),
            items: LIST(OBJ({ head: T(14), body: T(46), stat: OPT(8, { hint: '例: 1,000枚' }), statLabel: OPT(12), icon: ICON() }), 2, 4),
            highlight: NUM({ min: 1, max: 4 }) },
    render: s => `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-problem" style="--n:${s.items.length}">
        ${s.items.map((it, i) => `
          <div class="x-problem-row${s.highlight === i + 1 ? ' is-hl' : ''}">
            <div class="x-problem-key">
              ${it.stat ? `<div class="x-problem-stat">${numUnit(it.stat)}</div>${it.statLabel ? `<div class="x-problem-statlabel">${esc(it.statLabel)}</div>` : ''}`
                        : `<div class="x-icon-tile">${icon(it.icon || 'alert', 64)}</div>`}
            </div>
            <div class="x-problem-text">
              <h3>${rich(it.head)}</h3>
              <p>${rich(it.body)}</p>
            </div>
            ${s.highlight === i + 1 ? '<div class="x-sticker">いちばんの壁</div>' : ''}
          </div>`).join('')}
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  message: {
    name: 'キーメッセージ', family: 'frame', tone: 'dark',
    use: 'いちばん伝えたい一文。根拠の数字を1〜3個添えられる。デッキの山場に',
    spec: { kicker: OPT(24), message: T(40, { min: 6 }), sub: OPT(40),
            evidence: LIST(OBJ({ value: T(8), label: T(22) }), 0, 3, { req: false }) },
    render: s => `
      <div class="deco x-quote-mark">“</div>
      <div class="deco x-orb x-orb-c"></div>
      <div class="x-message${s.evidence?.length ? '' : ' is-solo'}">
        ${s.kicker ? `<div class="x-kicker">${esc(s.kicker)}</div>` : ''}
        <h2 class="x-message-text" data-slot="message">${rich(s.message)}</h2>
        ${s.sub ? `<p class="x-message-sub">${rich(s.sub)}</p>` : ''}
        ${s.evidence?.length ? `<div class="x-evidence" style="--n:${s.evidence.length}">${s.evidence.map(e => `
          <div class="x-evidence-item"><div class="x-evidence-value">${numUnit(e.value)}</div><div class="x-evidence-label">${rich(e.label)}</div></div>`).join('')}</div>` : ''}
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  'big-number': {
    name: '巨大数字', family: 'visual', tone: 'light',
    use: '一番伝えたい数字が1つあるとき（実績・削減量・規模）。比較（前→後）を添えると強い',
    spec: { kicker: OPT(24), title: T(28), body: T(80, { min: 20 }), note: OPT(40, { hint: '出典・期間' }),
            value: T(7, { hint: '例: 1,000 / 38 / 3' }), unit: OPT(4, { hint: '例: 枚 / % / 倍' }), label: T(18),
            from: OPT(10), to: OPT(10), ring: NUM({ min: 0, max: 100 }),
            chips: LIST(OBJ({ value: T(7), label: T(14), icon: ICON() }), 0, 2, { req: false }) },
    render: s => {
      const ring = typeof s.ring === 'number';
      const C = 2 * Math.PI * 150;
      return `
      <div class="deco x-dots"></div>
      <div class="deco x-ghost-num">${esc(s.value)}</div>
      ${head(s)}
      <div class="x-body x-bignum">
        <div class="x-bignum-copy">
          <p class="x-bignum-body">${rich(s.body)}</p>
          ${s.chips?.length ? `<div class="x-chips">${s.chips.map(ch => `
            <div class="x-chip">${ch.icon ? `<span class="x-chip-ico">${icon(ch.icon, 34)}</span>` : ''}<span class="x-chip-v">${esc(ch.value)}</span><span class="x-chip-l">${esc(ch.label)}</span></div>`).join('')}</div>` : ''}
          ${s.note ? `<div class="x-note">※ ${esc(s.note)}</div>` : ''}
        </div>
        <div class="x-hero" data-visual>
          <div class="x-sticker is-tilt">${esc(s.label)}</div>
          <div class="x-hero-main${ring ? ' has-ring' : ''}">
            ${ring ? `<svg class="x-ring" viewBox="0 0 340 340" aria-hidden="true">
                <circle cx="170" cy="170" r="150" class="x-ring-bg"/>
                <circle cx="170" cy="170" r="150" class="x-ring-fg" stroke-dasharray="${(C * s.ring / 100).toFixed(1)} ${C.toFixed(1)}"/></svg>` : ''}
            <div class="x-hero-value">${numUnit(s.value, s.unit)}</div>
          </div>
          ${s.from && s.to ? `<div class="x-fromto"><span class="x-from">${esc(s.from)}</span><span class="x-arrow">${icon('arrow', 56)}</span><span class="x-to">${esc(s.to)}</span></div>` : ''}
        </div>
      </div>`;
    },
  },

  /* ------------------------------------------------------------------ */
  compare: {
    name: '比較', family: 'visual', tone: 'light',
    use: 'Before→After（mode=before-after）／A vs B（versus）／役割分担など対等な2つ（split）',
    spec: { kicker: OPT(24), title: T(30), lead: OPT(56), mode: ENUM(['before-after', 'versus', 'split']),
            left: OBJ({ label: T(16), value: OPT(8), items: LIST(T(26), 2, 5) }),
            right: OBJ({ label: T(16), value: OPT(8), items: LIST(T(26), 2, 5) }),
            verdict: OPT(36) },
    render: s => {
      const mode = s.mode || 'before-after';
      const side = (p, cls, mark) => `
        <div class="x-side ${cls}">
          <div class="x-side-label">${rich(p.label)}</div>
          ${p.value ? `<div class="x-side-value">${numUnit(p.value)}</div>` : ''}
          <ul>${p.items.map(t => `<li><span class="x-li-mark">${mark}</span><span>${rich(t)}</span></li>`).join('')}</ul>
        </div>`;
      const leftMark = mode === 'before-after' ? icon('alert', 34) : mode === 'split' ? icon('robot', 34) : '•';
      const rightMark = mode === 'split' ? icon('person', 34) : icon('check', 34);
      return `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-compare is-${mode}" data-visual>
        <div class="x-compare-grid">
          ${side(s.left, 'is-left', leftMark)}
          ${mode === 'split' ? '' : `<div class="x-compare-mid">${mode === 'versus' ? '<span class="x-vs">VS</span>' : icon('arrow', 72)}</div>`}
          ${side(s.right, 'is-right', rightMark)}
        </div>
        ${s.verdict ? `<div class="x-verdict">${icon('flag', 40)}<span>${rich(s.verdict)}</span></div>` : ''}
      </div>`;
    },
  },

  /* ------------------------------------------------------------------ */
  flow: {
    name: '手順フロー', family: 'visual', tone: 'light',
    use: '順番のある手順・処理の流れ（3〜5段）。最後にゴールを置ける',
    spec: { kicker: OPT(24), title: T(28), lead: OPT(56),
            steps: LIST(OBJ({ head: T(12), body: T(40), tag: OPT(12), icon: ICON() }), 3, 5),
            highlight: NUM({ min: 1, max: 5 }), goal: OPT(28) },
    render: s => `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-flow" style="--n:${s.steps.length}" data-visual>
        <div class="x-flow-track"><div class="x-flow-line"></div>
          ${s.steps.map((st, i) => `<div class="x-flow-node${s.highlight === i + 1 ? ' is-hl' : ''}">${st.icon ? `${icon(st.icon, 50)}<b class="x-node-no">${i + 1}</b>` : `<span>${i + 1}</span>`}</div>`).join('')}
        </div>
        <div class="x-flow-cols">
          ${s.steps.map((st, i) => `
            <div class="x-flow-step${s.highlight === i + 1 ? ' is-hl' : ''}">
              ${s.steps.length <= 3 ? `<div class="x-step-no">STEP ${pad2(i + 1)}</div>` : ''}
              <h3>${rich(st.head)}</h3>
              <p>${rich(st.body)}</p>
              ${st.tag ? `<div class="x-tag">${esc(st.tag)}</div>` : ''}
            </div>`).join('')}
        </div>
        ${s.goal ? `<div class="x-goal"><span class="x-goal-label">GOAL</span><span>${rich(s.goal)}</span></div>` : ''}
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  timeline: {
    name: 'ロードマップ', family: 'visual', tone: 'light',
    use: '時期のある予定・フェーズ（3〜5個）。現在地を now で示す',
    spec: { kicker: OPT(24), title: T(28), lead: OPT(56),
            items: LIST(OBJ({ when: T(10), head: T(14), body: T(36) }), 3, 5), now: NUM({ min: 1, max: 5 }) },
    render: s => `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-timeline" style="--n:${s.items.length}" data-visual>
        <div class="x-tl-axis"><div class="x-tl-fill" style="--p:${s.now ? ((s.now - 0.5) / s.items.length) : 0}"></div></div>
        <div class="x-tl-cols">
          ${s.items.map((it, i) => {
            const st = s.now ? (i + 1 < s.now ? 'is-done' : i + 1 === s.now ? 'is-now' : 'is-next') : 'is-next';
            return `
            <div class="x-tl-item ${st}">
              <div class="x-tl-when">${esc(it.when)}${st === 'is-now' ? '<span class="x-pill">いまここ</span>' : ''}</div>
              <div class="x-tl-dot">${st === 'is-done' ? icon('check', 30) : ''}</div>
              <h3>${rich(it.head)}</h3>
              <p>${rich(it.body)}</p>
            </div>`;
          }).join('')}
        </div>
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  features: {
    name: '特徴・決めごと', family: 'cardish', tone: 'light',
    use: '順序のない要点3〜4個（強み・ルール・安全策）。各項目にアイコン必須。多用禁止（本文の25%まで）',
    spec: { kicker: OPT(24), title: T(28), lead: OPT(56),
            items: LIST(OBJ({ icon: ICON({ req: true }), head: T(14), body: T(44), stat: OPT(8) }), 3, 4),
            highlight: NUM({ min: 1, max: 4 }) },
    render: s => `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-features" style="--n:${s.items.length}">
        ${s.items.map((it, i) => `
          <div class="x-feature${s.highlight === i + 1 ? ' is-hl' : ''}" data-box>
            <div class="x-feature-top">
              <div class="x-icon-tile">${icon(it.icon, 60)}</div>
              <div class="x-feature-no">${pad2(i + 1)}</div>
            </div>
            <h3>${rich(it.head)}</h3>
            <p>${rich(it.body)}</p>
            ${it.stat ? `<div class="x-feature-stat">${numUnit(it.stat)}</div>` : ''}
          </div>`).join('')}
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  screenshot: {
    name: '画面紹介', family: 'visual', tone: 'light',
    use: '実際の画面を見せる。画像ファイルが無いときは使えない（別の型を選ぶ）',
    spec: { kicker: OPT(24), title: T(28), lead: OPT(56), image: IMG({ req: true }), url: OPT(40),
            points: LIST(OBJ({ head: T(14), body: T(40) }), 2, 3) },
    render: (s, c) => `
      <div class="deco x-dots"></div>
      <div class="deco x-orb x-orb-d"></div>
      ${head(s)}
      <div class="x-body x-shot">
        <ol class="x-shot-points">
          ${s.points.map((p, i) => `<li><span class="x-num-dot">${i + 1}</span><div><h3>${rich(p.head)}</h3><p>${rich(p.body)}</p></div></li>`).join('')}
        </ol>
        <div class="x-browser" data-visual>
          <div class="x-browser-bar"><i></i><i></i><i></i><span>${esc(s.url || '')}</span></div>
          <div class="x-browser-view"><img src="${esc(c.asset(s.image))}" alt=""></div>
        </div>
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  bars: {
    name: 'グラフ（棒）', family: 'visual', tone: 'light',
    use: '数量を比べる・推移を見せる（2〜6本）。言いたい棒を highlight、結論を takeaway に。数字は実数だけ',
    spec: { kicker: OPT(24), title: T(28), lead: OPT(56), mode: ENUM(['bar', 'column'], { hint: 'bar=横棒（項目の比較） / column=縦棒（時期の推移）' }),
            unit: OPT(4, { hint: '例: 時間 / 件 / %' }),
            items: LIST(OBJ({ label: T(12), value: NUM({ min: 0, max: 1e12, req: true }), display: OPT(10, { hint: '棒に出す文字。省略時は value＋unit' }) }), 2, 6),
            highlight: NUM({ min: 1, max: 6 }), takeaway: OPT(40, { hint: 'グラフから言えること。例: 月40時間が8時間に' }), note: OPT(40, { hint: '出典・期間' }) },
    render: s => {
      const mode = s.mode || 'bar';
      const max = Math.max(...s.items.map(it => it.value)) || 1;
      const show = it => it.display || `${it.value.toLocaleString('ja-JP')}${s.unit || ''}`;
      const hl = s.highlight ? s.items[s.highlight - 1] : null;
      return `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-bars is-${mode}${s.takeaway ? ' has-take' : ''}" style="--n:${s.items.length}">
        <div class="x-chart-wrap">
        <div class="x-chart" data-visual>
          ${s.items.map((it, i) => `
            <div class="x-bar-row${s.highlight === i + 1 ? ' is-hl' : ''}" style="--p:${Math.max(it.value / max, 0.04).toFixed(3)}">
              <div class="x-bar-label">${rich(it.label)}</div>
              <div class="x-bar-track"><div class="x-bar-fill"></div><div class="x-bar-value">${esc(show(it))}</div></div>
            </div>`).join('')}
        </div>
          ${s.note ? `<div class="x-note x-chart-note">※ ${esc(s.note)}</div>` : ''}
        </div>
        ${s.takeaway ? `
        <div class="x-take">
          ${hl ? `<div class="x-take-value">${numUnit(show(hl))}</div><div class="x-take-label">${rich(hl.label)}</div>` : `<div class="x-take-ico">${icon('bar-chart', 90)}</div>`}
          <div class="x-take-rule"></div>
          <p class="x-take-text">${rich(s.takeaway)}</p>
        </div>` : ''}
      </div>`;
    },
  },

  /* ------------------------------------------------------------------ */
  table: {
    name: '表', family: 'visual', tone: 'light',
    use: '2〜4つを3つ以上の観点で見比べる（プラン・方式・条件の一覧）。セルは短い言葉か ○ △ ×。highlight で推す列',
    spec: { kicker: OPT(24), title: T(28), lead: OPT(56), columns: LIST(T(12), 2, 4, { hint: '列の見出し（比べる対象）' }),
            rows: LIST(OBJ({ label: T(12), cells: LIST(T(18), 2, 4, { hint: 'columns と同じ個数' }) }), 2, 6),
            highlight: NUM({ min: 1, max: 4 }), note: OPT(40) },
    render: s => {
      const mark = t => ({ '○': 'is-ok', '◯': 'is-ok', '◎': 'is-best', '△': 'is-mid', '×': 'is-ng', '✕': 'is-ng' })[t.trim()];
      const cell = (t, j) => {
        const m = mark(t);
        const hl = s.highlight === j + 1 ? ' is-hl' : '';
        return m ? `<div class="x-td x-td-mark ${m}${hl}"><span>${esc(t.trim())}</span></div>` : `<div class="x-td${hl}"><span>${rich(t)}</span></div>`;
      };
      return `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-table-wrap">
        <div class="x-table" style="--cols:${s.columns.length};--rows:${s.rows.length}" data-visual>
          <div class="x-th x-th-corner"></div>
          ${s.columns.map((c, j) => `<div class="x-th${s.highlight === j + 1 ? ' is-hl' : ''}">${s.highlight === j + 1 ? '<span class="x-pill">おすすめ</span>' : ''}<span>${rich(c)}</span></div>`).join('')}
          ${s.rows.map(r => `<div class="x-td x-td-label"><span>${rich(r.label)}</span></div>${r.cells.map(cell).join('')}`).join('')}
        </div>
        ${s.note ? `<div class="x-note">※ ${esc(s.note)}</div>` : ''}
      </div>`;
    },
  },

  /* ------------------------------------------------------------------ */
  pricing: {
    name: '料金プラン', family: 'text', tone: 'light',
    use: '料金・プランを2〜3個。おすすめを recommend で1つ強調。金額は決まっている実際の数字だけ',
    spec: { kicker: OPT(24), title: T(28), lead: OPT(56),
            plans: LIST(OBJ({ name: T(12), price: T(10, { hint: '例: 220,000' }), unit: OPT(10, { hint: '例: 円（税込）' }), desc: OPT(30), items: LIST(T(22), 2, 5) }), 2, 3),
            recommend: NUM({ min: 1, max: 3 }), note: OPT(50) },
    render: s => `
      <div class="deco x-dots"></div>
      <div class="deco x-orb x-orb-d"></div>
      ${head(s)}
      <div class="x-body x-pricing" style="--n:${s.plans.length}">
        <div class="x-plans">
          ${s.plans.map((p, i) => `
            <div class="x-plan${s.recommend === i + 1 ? ' is-rec' : ''}">
              ${s.recommend === i + 1 ? '<div class="x-sticker">おすすめ</div>' : ''}
              <div class="x-plan-name">${rich(p.name)}</div>
              <div class="x-plan-price"><span class="x-plan-num">${esc(p.price)}</span>${p.unit ? `<span class="x-plan-unit">${esc(p.unit)}</span>` : ''}</div>
              ${p.desc ? `<p class="x-plan-desc">${rich(p.desc)}</p>` : ''}
              <ul>${p.items.map(t => `<li><span class="x-li-mark">${icon('check', 30)}</span><span>${rich(t)}</span></li>`).join('')}</ul>
            </div>`).join('')}
        </div>
        ${s.note ? `<div class="x-note">※ ${esc(s.note)}</div>` : ''}
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  pyramid: {
    name: '構造図（ピラミッド）', family: 'visual', tone: 'light',
    use: '土台の上に積み上がる関係・階層（3〜5段）。上から順に書く（上ほど目的・少数、下ほど土台）',
    spec: { kicker: OPT(24), title: T(28), lead: OPT(56),
            layers: LIST(OBJ({ head: T(12), body: T(40) }), 3, 5, { hint: '上の段から順に' }), highlight: NUM({ min: 1, max: 5 }) },
    render: s => {
      const n = s.layers.length;
      const w = t => 0.26 + 0.74 * t;          // 上端でも番号が入る幅を残す
      return `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-pyramid" style="--n:${n}" data-visual>
        ${s.layers.map((ly, i) => {
          const a = w(i / n), b = w((i + 1) / n);
          const poly = `${(50 - a * 50).toFixed(2)}% 0, ${(50 + a * 50).toFixed(2)}% 0, ${(50 + b * 50).toFixed(2)}% 100%, ${(50 - b * 50).toFixed(2)}% 100%`;
          return `
          <div class="x-pyr-row${s.highlight === i + 1 ? ' is-hl' : ''}" style="--i:${i}">
            <div class="x-pyr-shape" style="clip-path:polygon(${poly})"><span>${pad2(i + 1)}</span></div>
            <div class="x-pyr-line"></div>
            <div class="x-pyr-text"><h3>${rich(ly.head)}</h3><p>${rich(ly.body)}</p></div>
          </div>`;
        }).join('')}
      </div>`;
    },
  },

  /* ------------------------------------------------------------------ */
  matrix: {
    name: '2×2マトリクス', family: 'visual', tone: 'light',
    use: '2つの軸で4つに分ける（位置づけ・優先順位・狙う所）。cells は 左上→右上→左下→右下 の順',
    spec: { kicker: OPT(24), title: T(28), lead: OPT(56),
            x: OBJ({ label: T(10), low: T(8), high: T(8) }), y: OBJ({ label: T(10), low: T(8), high: T(8) }),
            cells: LIST(OBJ({ head: T(12), body: T(30) }), 4, 4, { hint: '左上・右上・左下・右下' }), highlight: NUM({ min: 1, max: 4 }) },
    render: s => `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-matrix" data-visual>
        <div class="x-mx-y"><span>${esc(s.y.high)}</span><b>${esc(s.y.label)}</b><span>${esc(s.y.low)}</span></div>
        <div class="x-mx-grid">
          ${s.cells.map((c, i) => `
            <div class="x-mx-cell${s.highlight === i + 1 ? ' is-hl' : ''}">
              ${s.highlight === i + 1 ? '<div class="x-sticker">ここを狙う</div>' : ''}
              <h3>${rich(c.head)}</h3><p>${rich(c.body)}</p>
            </div>`).join('')}
          <div class="deco x-mx-cross"></div>
        </div>
        <div class="x-mx-x"><span>${esc(s.x.low)}</span><b>${esc(s.x.label)}</b><span>${esc(s.x.high)}</span></div>
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  funnel: {
    name: 'ファネル', family: 'visual', tone: 'light',
    use: '段階ごとに数が絞られていく流れ（認知→問い合わせ→成約など3〜5段）。数字は実数だけ',
    spec: { kicker: OPT(24), title: T(28), lead: OPT(56),
            stages: LIST(OBJ({ label: T(10), value: OPT(10, { hint: '例: 1,200人 / 38%' }), body: T(36) }), 3, 5),
            highlight: NUM({ min: 1, max: 5 }) },
    render: s => {
      const n = s.stages.length;
      return `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-funnel" style="--n:${n}" data-visual>
        ${s.stages.map((st, i) => `
          <div class="x-fn-row${s.highlight === i + 1 ? ' is-hl' : ''}">
            <div class="x-fn-lane"><div class="x-fn-bar" style="--w:${(1 - i * (0.5 / Math.max(n - 1, 1))).toFixed(3)}">${st.value ? `<span class="x-fn-value">${numUnit(st.value)}</span>` : `<span class="x-fn-no">${pad2(i + 1)}</span>`}</div></div>
            <div class="x-fn-text"><h3>${rich(st.label)}</h3><p>${rich(st.body)}</p></div>
          </div>`).join('')}
      </div>`;
    },
  },

  /* ------------------------------------------------------------------ */
  testimonial: {
    name: 'お客様の声・事例', family: 'text', tone: 'light',
    use: '実在の利用者の声・導入事例。発言は本人の言葉のまま（作らない）。成果の数字があれば results に',
    spec: { kicker: OPT(24), title: T(28), quote: T(90, { min: 10 }), name: T(20, { hint: '許可を取った表記。例: A治療院 院長' }),
            role: OPT(30), image: IMG({ req: false }),
            results: LIST(OBJ({ value: T(8), label: T(16) }), 0, 3, { req: false }) },
    render: (s, c) => `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-voice${s.results?.length ? ' has-results' : ''}">
        <div class="x-voice-card">
          <div class="deco x-voice-mark">“</div>
          <p class="x-voice-quote">${rich(s.quote)}</p>
          <div class="x-voice-who">
            ${s.image ? `<div class="x-avatar" data-visual><img src="${esc(c.asset(s.image))}" alt=""></div>` : `<div class="x-avatar is-icon">${icon('person', 56)}</div>`}
            <div><div class="x-voice-name">${esc(s.name)}</div>${s.role ? `<div class="x-voice-role">${esc(s.role)}</div>` : ''}</div>
          </div>
        </div>
        ${s.results?.length ? `<div class="x-results" data-visual>${s.results.map(r => `
          <div class="x-result"><div class="x-result-value">${numUnit(r.value)}</div><div class="x-result-label">${rich(r.label)}</div></div>`).join('')}</div>` : ''}
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  profile: {
    name: 'プロフィール', family: 'text', tone: 'light',
    use: '話し手・会社・担当者の紹介。実績の数字と肩書きは事実だけ',
    spec: { kicker: OPT(24), title: T(20, { hint: '例: 講師紹介 / 私たちについて' }), name: T(16), role: T(30),
            image: IMG({ req: false }), bio: T(100, { min: 20 }),
            facts: LIST(OBJ({ value: T(8), label: T(16) }), 0, 3, { req: false }), tags: LIST(T(12), 0, 4, { req: false }) },
    render: (s, c) => `
      <div class="deco x-dots"></div>
      <div class="deco x-ghost-word">PROFILE</div>
      ${head(s)}
      <div class="x-body x-profile">
        <div class="x-profile-visual">
          ${s.image ? `<div class="x-portrait" data-visual><img src="${esc(c.asset(s.image))}" alt=""></div><div class="deco x-photo-frame"></div>`
                    : `<div class="x-emblem is-sm">${icon('person', 200)}</div>`}
        </div>
        <div class="x-profile-copy">
          <div class="x-profile-role">${esc(s.role)}</div>
          <div class="x-profile-name">${esc(s.name)}</div>
          ${s.tags?.length ? `<div class="x-tags">${s.tags.map(t => `<span class="x-tag">${esc(t)}</span>`).join('')}</div>` : ''}
          <p class="x-profile-bio">${rich(s.bio)}</p>
          ${s.facts?.length ? `<div class="x-facts" style="--n:${s.facts.length}">${s.facts.map(f => `
            <div class="x-fact"><div class="x-fact-value">${numUnit(f.value)}</div><div class="x-fact-label">${rich(f.label)}</div></div>`).join('')}</div>` : ''}
        </div>
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  photo: {
    name: '写真＋メッセージ', family: 'frame', tone: 'dark',
    use: '実物の写真1枚で空気・現場を伝える山場。写真ファイルが無いときは使えない（message を使う）',
    spec: { kicker: OPT(24), message: T(26, { min: 6, hint: '1行14字×2行まで' }), sub: OPT(50), image: IMG({ req: true }), credit: OPT(30) },
    render: (s, c) => `
      <div class="x-photo-bg" data-visual><img src="${esc(c.asset(s.image))}" alt=""></div>
      <div class="deco x-photo-scrim"></div>
      <div class="x-photo-copy">
        ${s.kicker ? `<div class="x-kicker">${esc(s.kicker)}</div>` : ''}
        <h2 class="x-photo-message" data-slot="message">${rich(s.message)}</h2>
        ${s.sub ? `<p class="x-photo-sub">${rich(s.sub)}</p>` : ''}
        ${s.credit ? `<div class="x-note">${esc(s.credit)}</div>` : ''}
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  faq: {
    name: 'よくある質問', family: 'text', tone: 'light',
    use: '導入前の不安に先回りして答える（2〜4問）。答えは結論から書く',
    spec: { kicker: OPT(24), title: T(28), items: LIST(OBJ({ q: T(30), a: T(64) }), 2, 4) },
    render: s => `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-faq" style="--n:${s.items.length}">
        ${s.items.map(it => `
          <div class="x-faq-item">
            <div class="x-faq-q"><span class="x-qa is-q">Q</span><h3>${rich(it.q)}</h3></div>
            <div class="x-faq-a"><span class="x-qa is-a">A</span><p>${rich(it.a)}</p></div>
          </div>`).join('')}
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  summary: {
    name: 'まとめ', family: 'text', tone: 'light',
    use: '締めの直前に要点を3〜4個で振り返る。各要点は言い切りの一文',
    spec: { kicker: OPT(24), title: T(24), points: LIST(OBJ({ head: T(20), body: OPT(40) }), 3, 4), next: OPT(30, { hint: '次にしてほしいこと' }) },
    render: s => `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-summary" style="--n:${s.points.length}">
        <div class="x-sum-panel">
          <div class="x-sum-count"><span class="x-n">${s.points.length}</span><span class="x-u">つの要点</span></div>
          ${s.next ? `<div class="x-sum-next"><span class="x-sum-next-label">NEXT</span><span>${rich(s.next)}</span></div>` : ''}
        </div>
        <ol class="x-sum-list">
          ${s.points.map((p, i) => `
            <li><span class="x-sum-no">${pad2(i + 1)}</span><div><h3>${rich(p.head)}</h3>${p.body ? `<p>${rich(p.body)}</p>` : ''}</div></li>`).join('')}
        </ol>
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  stats: {
    name: '数字で見る', family: 'visual', tone: 'light',
    use: '主役の数字が2〜4個並ぶとき（会社の規模・KPI・実績）。1つだけなら big-number。数字は実数だけ',
    spec: { kicker: OPT(24), title: T(28), lead: OPT(56),
            items: LIST(OBJ({ value: T(8, { hint: '例: 1,200社 / 98%' }), label: T(16), note: OPT(24, { hint: '前年比・期間など' }), icon: ICON() }), 2, 4),
            highlight: NUM({ min: 1, max: 4 }), note: OPT(40, { hint: '出典・時点' }) },
    render: s => `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-stats" style="--n:${s.items.length}">
        <div class="x-stats-grid" data-visual>
          ${s.items.map((it, i) => `
            <div class="x-stat${s.highlight === i + 1 ? ' is-hl' : ''}">
              ${it.icon ? `<div class="x-stat-ico">${icon(it.icon, 44)}</div>` : ''}
              <div class="x-stat-value">${numUnit(it.value)}</div>
              <div class="x-stat-label">${rich(it.label)}</div>
              ${it.note ? `<div class="x-stat-note">${esc(it.note)}</div>` : ''}
            </div>`).join('')}
        </div>
        ${s.note ? `<div class="x-note">※ ${esc(s.note)}</div>` : ''}
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  spec: {
    name: '概要（項目と内容）', family: 'text', tone: 'light',
    use: '会社概要・開催概要・募集要項など「項目：内容」の一覧（3〜7行）。行ごとに短く',
    spec: { kicker: OPT(24), title: T(24), rows: LIST(OBJ({ key: T(8, { hint: '例: 日時 / 所在地' }), value: T(40) }), 3, 7),
            icon: ICON(), image: IMG({ req: false }), cta: OPT(24, { hint: '申し込み方法など1行' }) },
    render: (s, c) => `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-spec${s.image || s.icon ? ' has-side' : ''}" style="--n:${s.rows.length}">
        <dl class="x-spec-list">
          ${s.rows.map(r => `<div class="x-spec-row"><dt>${esc(r.key)}</dt><dd>${rich(r.value)}</dd></div>`).join('')}
        </dl>
        ${s.image ? `<div class="x-spec-side"><div class="x-photo" data-visual><img src="${esc(c.asset(s.image))}" alt=""></div></div>`
          : s.icon ? `<div class="x-spec-side"><div class="x-emblem is-sm">${icon(s.icon, 190)}</div>${s.cta ? '' : ''}</div>` : ''}
      </div>
      ${s.cta ? `<div class="x-spec-cta">${icon('arrow', 36)}<span>${rich(s.cta)}</span></div>` : ''}`,
  },

  /* ------------------------------------------------------------------ */
  team: {
    name: 'チーム紹介', family: 'text', tone: 'light',
    use: '2〜4人のメンバー紹介。1人だけなら profile。肩書き・経歴は事実だけ。写真が無ければ頭文字の丸になる',
    spec: { kicker: OPT(24), title: T(24), lead: OPT(56),
            members: LIST(OBJ({ name: T(12), role: T(20), bio: T(44), image: IMG({ req: false }) }), 2, 4) },
    render: (s, c) => `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-team" style="--n:${s.members.length}">
        ${s.members.map(m => `
          <div class="x-member">
            ${m.image ? `<div class="x-member-photo" data-visual><img src="${esc(c.asset(m.image))}" alt=""></div>`
                      : `<div class="x-member-photo is-initial"><span>${esc([...m.name.trim()][0] || '')}</span></div>`}
            <div class="x-member-role">${esc(m.role)}</div>
            <div class="x-member-name">${esc(m.name)}</div>
            <p class="x-member-bio">${rich(m.bio)}</p>
          </div>`).join('')}
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  question: {
    name: '問いかけ・ワーク', family: 'frame', tone: 'dark',
    use: '聞き手に考えてもらう問い・手を動かすワーク。時間とやることを添えられる（講座・研修・クイズ）',
    spec: { kicker: OPT(24, { hint: '例: WORK / QUESTION' }), question: T(32, { min: 6, hint: '「？」で終わる問い、または「〜を書き出す」。steps を付けるなら24字まで' }),
            sub: OPT(50), time: OPT(8, { hint: '例: 3分' }), steps: LIST(T(26), 0, 3, { req: false, hint: 'ワークの手順' }) },
    render: s => `
      <div class="deco x-ghost-word is-dark">${s.steps?.length ? 'WORK' : 'Q'}</div>
      <div class="deco x-orb x-orb-c"></div>
      <div class="x-question${s.steps?.length ? ' has-steps' : ''}">
        <div class="x-question-main">
          <div class="x-question-top">
            <div class="x-kicker">${esc(s.kicker || (s.steps?.length ? 'WORK' : 'QUESTION'))}</div>
            ${s.time ? `<div class="x-timer">${icon('clock', 40)}<span>${esc(s.time)}</span></div>` : ''}
          </div>
          <h2 class="x-question-text" data-slot="message">${rich(s.question)}</h2>
          ${s.sub ? `<p class="x-question-sub">${rich(s.sub)}</p>` : ''}
        </div>
        ${s.steps?.length ? `<ol class="x-question-steps">${s.steps.map((t, i) => `<li><span class="x-num-dot">${i + 1}</span><span>${rich(t)}</span></li>`).join('')}</ol>` : ''}
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  checklist: {
    name: 'チェックリスト', family: 'text', tone: 'light',
    use: '明日からやること・持ち物・作業前の確認など、チェックして使う項目（3〜6個）',
    spec: { kicker: OPT(24), title: T(28), lead: OPT(56), items: LIST(OBJ({ head: T(20), body: OPT(36) }), 3, 6), note: OPT(40) },
    render: s => `
      <div class="deco x-dots"></div>
      ${head(s)}
      <div class="x-body x-checklist${s.items.length > 3 ? ' is-two' : ''}" style="--rows:${s.items.length > 3 ? Math.ceil(s.items.length / 2) : s.items.length}">
        ${s.items.map(it => `
          <div class="x-check-item">
            <span class="x-checkbox">${icon('check', 40)}</span>
            <div><h3>${rich(it.head)}</h3>${it.body ? `<p>${rich(it.body)}</p>` : ''}</div>
          </div>`).join('')}
      </div>
      ${s.note ? `<div class="x-note x-checklist-note">※ ${esc(s.note)}</div>` : ''}`,
  },

  /* ------------------------------------------------------------------ */
  quote: {
    name: '引用・名言', family: 'frame', tone: 'dark',
    use: '実在の人の言葉を大きく見せる（講演・インタビュー・事例）。発言者と出典がある言葉だけ。自分たちの主張なら message',
    spec: { kicker: OPT(24), quote: T(60, { min: 6 }), name: T(20), role: OPT(30), image: IMG({ req: false }) },
    render: (s, c) => `
      <div class="deco x-quote-mark">“</div>
      <div class="deco x-orb x-orb-c"></div>
      <div class="x-quote${s.image ? ' has-photo' : ''}">
        <div class="x-quote-main">
          ${s.kicker ? `<div class="x-kicker">${esc(s.kicker)}</div>` : ''}
          <blockquote class="x-quote-text" data-slot="quote">${rich(s.quote)}</blockquote>
          <div class="x-quote-who"><span class="x-quote-rule"></span><div><div class="x-quote-name">${esc(s.name)}</div>${s.role ? `<div class="x-quote-role">${esc(s.role)}</div>` : ''}</div></div>
        </div>
        ${s.image ? `<div class="x-quote-photo" data-visual><img src="${esc(c.asset(s.image))}" alt=""></div>` : ''}
      </div>`,
  },

  /* ------------------------------------------------------------------ */
  closing: {
    name: '締め・行動喚起', family: 'frame', tone: 'dark',
    use: '最後の1枚。次にしてほしい行動を1つだけ',
    spec: { kicker: OPT(20), title: T(24), subtitle: OPT(70), cta: T(26, { hint: '動詞で終わる行動。例: デモを触ってみる' }), contact: OPT(40) },
    render: s => `
      <div class="deco x-ghost-word is-dark">NEXT</div>
      <div class="deco x-orb x-orb-c"></div>
      <div class="x-closing">
        <div class="x-kicker">${esc(s.kicker || 'NEXT STEP')}</div>
        <h2 class="x-closing-title" data-slot="title">${rich(s.title)}</h2>
        ${s.subtitle ? `<p class="x-closing-sub">${rich(s.subtitle)}</p>` : ''}
        <div class="x-cta"><span>${rich(s.cta)}</span><span class="x-cta-arrow">${icon('arrow', 44)}</span></div>
        ${s.contact ? `<div class="x-contact">${esc(s.contact)}</div>` : ''}
      </div>`,
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);
