#!/usr/bin/env node
/**
 * pptx.mjs — deck.json から編集可能なPPTX（パワポ/Canva用）を生成する
 *
 * 使い方:
 *   node scripts/pptx.mjs <デッキフォルダ>        # <フォルダ>/deck.json → <フォルダ>/out/<名前>.pptx
 *
 * 思想（HTMLルートと同じ）:
 *   レイアウトはこのスクリプトに完全固定。Claudeの仕事は deck.json に文章を流し込むことだけ。
 *   文字は必ずテキストボックスとして配置する（画像に焼き込まない）。これが
 *   「納品後にCanva/パワポで文字を直せる」ことの生命線。
 *
 * deck.json の形式は SKILL.md「PPTX出力ルート」を参照。
 */

import { readFile, mkdir, access } from "node:fs/promises";
import { join, resolve, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pptxgen from "pptxgenjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const THEMES_PATH = join(__dirname, "..", "themes", "pptx-themes.json");

/** スライド寸法（インチ・16:9ワイド） */
const W = 13.33;
const H = 7.5;
const MX = 0.7; // 左右マージン

const LAYOUTS = ["cover", "agenda", "section", "points", "split", "quote", "data", "closing"];

/** 文字量の目安（超えたら警告。QCの簡易版） */
const SOFT_LIMITS = { title: 40, subtitle: 60, head: 18, body: 130, item: 30, quote: 60 };

const C = (hex) => String(hex).replace("#", "");

function fail(message) {
  console.error(`エラー: ${message}`);
  process.exit(1);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** ブランド名（左下）とページ番号（右下）。表紙・締めはページ番号なし。
 *  x0/x1 で左右位置を上書きできる（splitで写真にページ番号が重なるのを避ける用） */
function addFooter(slide, T, ctx, { onDark = false, pageNo = true, x0 = MX, x1 = W - 0.45 } = {}) {
  const sub = onDark ? T.darkSub : T.ink2;
  if (ctx.brand) {
    slide.addText(ctx.brand, {
      x: x0, y: H - 0.52, w: 4, h: 0.35,
      fontSize: 9.5, fontFace: T.fontBody, color: C(sub), align: "left", valign: "middle",
    });
  }
  if (pageNo) {
    slide.addText(`${String(ctx.pageNo).padStart(2, "0")} / ${String(ctx.total).padStart(2, "0")}`, {
      x: x1 - 1.55, y: H - 0.52, w: 1.55, h: 0.35,
      fontSize: 9.5, fontFace: T.fontBody, color: C(sub), align: "right", valign: "middle",
    });
  }
}

/** 全面写真＋黒スクリム（表紙・締め用）。写真の上に文字を置くための暗幕 */
function addCoverImage(pres, slide, imgPath, scrim = 48) {
  slide.addImage({ path: imgPath, x: 0, y: 0, w: W, h: H, sizing: { type: "cover", w: W, h: H } });
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: W, h: H, fill: { color: "000000", transparency: 100 - scrim }, line: { type: "none" },
  });
}

/** アクセントバー（見出しの上の短い横線） */
function addAccentBar(pres, slide, T, x, y, w = 0.9) {
  slide.addShape(pres.ShapeType.rect, {
    x, y, w, h: 0.07, fill: { color: C(T.accent) }, line: { type: "none" },
  });
}

// ---------------------------------------------------------------- レイアウト実装

function buildCover(pres, slide, s, T, ctx) {
  const hasImg = Boolean(s._imgPath);
  if (hasImg) addCoverImage(pres, slide, s._imgPath);
  else slide.background = { color: C(T.darkBg) };
  const inkMain = hasImg ? "FFFFFF" : C(T.darkInk);
  const inkSub = hasImg ? "E8E6E2" : C(T.darkSub);

  addAccentBar(pres, slide, T, MX, 3.95, 1.0);
  slide.addText(s.title ?? "", {
    x: MX, y: 4.15, w: W - MX * 2, h: 1.7,
    fontSize: 40, fontFace: T.fontHead, color: inkMain, bold: true,
    align: "left", valign: "top", lineSpacingMultiple: 1.15, fit: "shrink",
  });
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: MX, y: 5.9, w: W - MX * 2, h: 0.8,
      fontSize: 15, fontFace: T.fontBody, color: inkSub,
      align: "left", valign: "top", lineSpacingMultiple: 1.3, fit: "shrink",
    });
  }
  addFooter(slide, { ...T, darkSub: inkSub, ink2: inkSub }, ctx, { onDark: true, pageNo: false });
}

function buildAgenda(pres, slide, s, T, ctx) {
  slide.background = { color: C(T.bgSoft) };
  addAccentBar(pres, slide, T, MX, 0.95);
  slide.addText(s.title ?? "本日の流れ", {
    x: MX, y: 1.1, w: W - MX * 2, h: 0.8,
    fontSize: 26, fontFace: T.fontHead, color: C(T.ink), bold: true, align: "left", valign: "top",
  });

  const items = (s.items ?? []).slice(0, 6);
  const top = 2.35;
  const rowH = Math.min(0.95, 4.4 / Math.max(items.length, 1));
  items.forEach((item, i) => {
    const y = top + i * rowH;
    slide.addText(String(i + 1).padStart(2, "0"), {
      x: MX, y, w: 0.85, h: rowH,
      fontSize: 19, fontFace: T.fontHead, color: C(T.accent), bold: true, align: "left", valign: "middle",
    });
    slide.addText(item, {
      x: MX + 0.95, y, w: W - MX * 2 - 0.95, h: rowH,
      fontSize: 16.5, fontFace: T.fontBody, color: C(T.ink), align: "left", valign: "middle", fit: "shrink",
    });
    if (i < items.length - 1) {
      slide.addShape(pres.ShapeType.rect, {
        x: MX, y: y + rowH - 0.01, w: W - MX * 2, h: 0.012,
        fill: { color: C(T.ink2), transparency: 82 }, line: { type: "none" },
      });
    }
  });
  addFooter(slide, T, ctx);
}

function buildSection(pres, slide, s, T, ctx) {
  slide.background = { color: C(T.darkBg) };
  const no = s.no ?? String(ctx.pageNo).padStart(2, "0");
  // 透かしの巨大数字（ghost）。右側に沈める
  slide.addText(no, {
    x: W - 6.9, y: 0.9, w: 6.3, h: 5.9,
    fontSize: 300, fontFace: T.fontHead, color: C(T.darkSub), bold: true,
    align: "right", valign: "middle", transparency: 84,
  });
  slide.addText(`SECTION ${no}`, {
    x: MX, y: 2.85, w: 6, h: 0.45,
    fontSize: 13, fontFace: T.fontBody, color: C(T.accent), bold: true, charSpacing: 4, align: "left",
  });
  slide.addText(s.title ?? "", {
    x: MX, y: 3.35, w: W - MX * 2 - 1.5, h: 1.8,
    fontSize: 33, fontFace: T.fontHead, color: C(T.darkInk), bold: true,
    align: "left", valign: "top", lineSpacingMultiple: 1.2, fit: "shrink",
  });
  addFooter(slide, T, ctx, { onDark: true });
}

function buildPoints(pres, slide, s, T, ctx) {
  slide.background = { color: C(T.bg) };
  addAccentBar(pres, slide, T, MX, 0.95);
  slide.addText(s.title ?? "", {
    x: MX, y: 1.1, w: W - MX * 2, h: 0.8,
    fontSize: 24, fontFace: T.fontHead, color: C(T.ink), bold: true, align: "left", valign: "top", fit: "shrink",
  });

  const pts = (s.points ?? []).slice(0, 4);
  const n = pts.length;
  const areaY = 2.3;
  const areaH = 4.35;
  const gap = 0.35;
  // カード面が背景と同色のテーマ（minimal等）は薄い枠線で輪郭を出す
  const cardLine = T.bgSoft === T.bg ? { color: "DDDDDD", width: 1 } : { type: "none" };

  const cells =
    n <= 2
      ? pts.map((_, i) => ({ x: MX, y: areaY + i * ((areaH + gap) / 2), w: W - MX * 2, h: (areaH - gap) / 2 }))
      : n === 3
        ? pts.map((_, i) => ({ x: MX + i * ((W - MX * 2 + gap) / 3), y: areaY, w: (W - MX * 2 - gap * 2) / 3, h: areaH }))
        : pts.map((_, i) => ({
            x: MX + (i % 2) * ((W - MX * 2 + gap) / 2),
            y: areaY + Math.floor(i / 2) * ((areaH + gap) / 2),
            w: (W - MX * 2 - gap) / 2,
            h: (areaH - gap) / 2,
          }));

  pts.forEach((p, i) => {
    const c = cells[i];
    slide.addShape(pres.ShapeType.roundRect, {
      x: c.x, y: c.y, w: c.w, h: c.h, rectRadius: 0.08,
      fill: { color: C(T.bgSoft) }, line: cardLine, shadow: { type: "outer", blur: 6, offset: 2, angle: 90, color: "000000", opacity: 0.12 },
    });
    slide.addShape(pres.ShapeType.rect, {
      x: c.x + 0.35, y: c.y + 0.38, w: 0.42, h: 0.07, fill: { color: C(T.accent) }, line: { type: "none" },
    });
    slide.addText(p.head ?? "", {
      x: c.x + 0.32, y: c.y + 0.52, w: c.w - 0.64, h: 0.65,
      fontSize: 15.5, fontFace: T.fontHead, color: C(T.ink), bold: true, align: "left", valign: "top", fit: "shrink",
    });
    slide.addText(p.body ?? "", {
      x: c.x + 0.32, y: c.y + 1.18, w: c.w - 0.64, h: c.h - 1.5,
      fontSize: 11.5, fontFace: T.fontBody, color: C(T.ink2), align: "left", valign: "top",
      lineSpacingMultiple: 1.35, fit: "shrink",
    });
  });
  addFooter(slide, T, ctx);
}

function buildSplit(pres, slide, s, T, ctx) {
  slide.background = { color: C(T.bg) };
  const imgLeft = s.imageSide === "left";
  const imgX = imgLeft ? 0 : W * 0.55;
  const txtX = imgLeft ? W * 0.45 + 0.5 : MX;

  slide.addImage({
    path: s._imgPath, x: imgX, y: 0, w: W * 0.45, h: H, sizing: { type: "cover", w: W * 0.45, h: H },
  });

  addAccentBar(pres, slide, T, txtX, 1.45);
  slide.addText(s.title ?? "", {
    x: txtX, y: 1.62, w: W * 0.55 - MX - 0.5, h: 1.3,
    fontSize: 24, fontFace: T.fontHead, color: C(T.ink), bold: true,
    align: "left", valign: "top", lineSpacingMultiple: 1.2, fit: "shrink",
  });
  let y = 3.05;
  if (s.body) {
    // 本文の行数を概算して高さを内容に合わせる（固定高だと箇条書きとの間が間延びする）
    const textW = W * 0.55 - MX - 0.5;
    const charsPerLine = Math.floor(textW / 0.19); // 13ptの全角 ≒ 0.19インチ
    const lines = String(s.body).split("\n").reduce((n, ln) => n + Math.max(1, Math.ceil(ln.length / charsPerLine)), 0);
    const bodyH = Math.min(1.9, lines * 0.29 + 0.1);
    slide.addText(s.body, {
      x: txtX, y, w: textW, h: bodyH + 0.15,
      fontSize: 13, fontFace: T.fontBody, color: C(T.ink2), align: "left", valign: "top",
      lineSpacingMultiple: 1.5, fit: "shrink",
    });
    y += bodyH + 0.4;
  }
  (s.bullets ?? []).slice(0, 4).forEach((b) => {
    slide.addText(
      [
        { text: "— ", options: { color: C(T.accent), bold: true } },
        { text: b, options: { color: C(T.ink) } },
      ],
      { x: txtX, y, w: W * 0.55 - MX - 0.5, h: 0.5, fontSize: 12.5, fontFace: T.fontBody, align: "left", valign: "top", fit: "shrink" }
    );
    y += 0.52;
  });
  // フッターは文字側の列に収める（写真にページ番号が重なると読めない）
  addFooter(slide, T, ctx, imgLeft ? { x0: txtX, x1: W - 0.45 } : { x0: MX, x1: W * 0.55 - 0.35 });
}

function buildQuote(pres, slide, s, T, ctx) {
  slide.background = { color: C(T.darkBg) };
  slide.addText("“", {
    x: W / 2 - 1, y: 0.75, w: 2, h: 1.2,
    fontSize: 84, fontFace: T.fontHead, color: C(T.accent), bold: true, align: "center", valign: "top",
  });
  slide.addText(s.text ?? "", {
    x: 1.4, y: 2.15, w: W - 2.8, h: 2.9,
    fontSize: 25, fontFace: T.fontHead, color: C(T.darkInk), bold: true,
    align: "center", valign: "middle", lineSpacingMultiple: 1.5, fit: "shrink",
  });
  slide.addShape(pres.ShapeType.rect, {
    x: W / 2 - 0.45, y: 5.35, w: 0.9, h: 0.05, fill: { color: C(T.accent) }, line: { type: "none" },
  });
  if (s.by) {
    slide.addText(s.by, {
      x: 1.4, y: 5.6, w: W - 2.8, h: 0.5,
      fontSize: 12.5, fontFace: T.fontBody, color: C(T.darkSub), align: "center", valign: "top",
    });
  }
  addFooter(slide, T, ctx, { onDark: true });
}

function buildData(pres, slide, s, T, ctx) {
  slide.background = { color: C(T.bgSoft) };
  slide.addText(s.value ?? "", {
    x: 1, y: 1.55, w: W - 2, h: 2.5,
    fontSize: 110, fontFace: T.fontHead, color: C(T.accent), bold: true,
    align: "center", valign: "middle", fit: "shrink",
  });
  slide.addText(s.label ?? "", {
    x: 1.5, y: 4.25, w: W - 3, h: 0.75,
    fontSize: 20, fontFace: T.fontHead, color: C(T.ink), bold: true, align: "center", valign: "top", fit: "shrink",
  });
  if (s.note) {
    slide.addText(s.note, {
      x: (W - 8.6) / 2, y: 5.15, w: 8.6, h: 1.1,
      fontSize: 12.5, fontFace: T.fontBody, color: C(T.ink2), align: "center", valign: "top",
      lineSpacingMultiple: 1.45, fit: "shrink",
    });
  }
  addFooter(slide, T, ctx);
}

function buildClosing(pres, slide, s, T, ctx) {
  const hasImg = Boolean(s._imgPath);
  if (hasImg) addCoverImage(pres, slide, s._imgPath, 55);
  else slide.background = { color: C(T.darkBg) };
  const inkMain = hasImg ? "FFFFFF" : C(T.darkInk);
  const inkSub = hasImg ? "E8E6E2" : C(T.darkSub);

  slide.addText(s.title ?? "", {
    x: 1.2, y: 2.75, w: W - 2.4, h: 1.6,
    fontSize: 36, fontFace: T.fontHead, color: inkMain, bold: true,
    align: "center", valign: "middle", lineSpacingMultiple: 1.2, fit: "shrink",
  });
  slide.addShape(pres.ShapeType.rect, {
    x: W / 2 - 0.5, y: 4.55, w: 1.0, h: 0.06, fill: { color: C(T.accent) }, line: { type: "none" },
  });
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 1.2, y: 4.85, w: W - 2.4, h: 0.8,
      fontSize: 14, fontFace: T.fontBody, color: inkSub, align: "center", valign: "top", fit: "shrink",
    });
  }
  addFooter(slide, { ...T, darkSub: inkSub, ink2: inkSub }, ctx, { onDark: true, pageNo: false });
}

const BUILDERS = {
  cover: buildCover,
  agenda: buildAgenda,
  section: buildSection,
  points: buildPoints,
  split: buildSplit,
  quote: buildQuote,
  data: buildData,
  closing: buildClosing,
};

// ---------------------------------------------------------------- 検証

function collectWarnings(slides) {
  const warns = [];
  const over = (label, text, limit, i) => {
    if (text && String(text).replace(/\n/g, "").length > limit) {
      warns.push(`  slide ${i + 1}: ${label} が長すぎます（${String(text).length}文字 > 目安${limit}）`);
    }
  };
  slides.forEach((s, i) => {
    over("title", s.title, SOFT_LIMITS.title, i);
    over("subtitle", s.subtitle, SOFT_LIMITS.subtitle, i);
    over("quote text", s.text, SOFT_LIMITS.quote, i);
    (s.points ?? []).forEach((p) => {
      over("points.head", p.head, SOFT_LIMITS.head, i);
      over("points.body", p.body, SOFT_LIMITS.body, i);
    });
    (s.items ?? []).forEach((it) => over("agenda item", it, SOFT_LIMITS.item, i));
  });
  return warns;
}

// ---------------------------------------------------------------- メイン

async function main() {
  const arg = process.argv[2];
  if (!arg || arg === "--help" || arg === "-h") {
    console.log(`pptx.mjs — deck.json から編集可能なPPTX（パワポ/Canva用）を生成

使い方:
  node scripts/pptx.mjs <デッキフォルダ>

<デッキフォルダ>/deck.json を読み、<デッキフォルダ>/out/<デッキ名>.pptx を出力します。
deck.json の書き方は SKILL.md「PPTX出力ルート」を参照。
レイアウト: ${LAYOUTS.join(" / ")}`);
    return;
  }

  const deckDir = resolve(arg);
  const deckJsonPath = join(deckDir, "deck.json");
  if (!(await exists(deckJsonPath))) fail(`deck.json が見つかりません: ${deckJsonPath}`);

  let deck;
  try {
    deck = JSON.parse(await readFile(deckJsonPath, "utf8"));
  } catch (err) {
    fail(`deck.json のJSON解析に失敗しました: ${err.message}`);
  }

  let themes;
  try {
    themes = JSON.parse(await readFile(THEMES_PATH, "utf8"));
  } catch (err) {
    fail(`テーマ定義（themes/pptx-themes.json）の読み込みに失敗しました: ${err.message}`);
  }

  const themeName = deck.theme ?? "corporate";
  const T = themes[themeName];
  if (!T || themeName === "_readme") {
    fail(`不明なテーマ: ${themeName}\n利用可能: ${Object.keys(themes).filter((k) => k !== "_readme").join(", ")}`);
  }

  const slides = deck.slides ?? [];
  if (!Array.isArray(slides) || slides.length === 0) fail("deck.json に slides がありません（1枚以上必要）");

  // レイアウト名と画像パスを事前検証（全部まとめて報告してから止める）
  const problems = [];
  for (const [i, s] of slides.entries()) {
    if (!BUILDERS[s.layout]) {
      problems.push(`  slide ${i + 1}: 不明なレイアウト "${s.layout}"（利用可能: ${LAYOUTS.join(", ")}）`);
      continue;
    }
    if (s.image) {
      const p = resolve(deckDir, s.image);
      if (await exists(p)) s._imgPath = p;
      else problems.push(`  slide ${i + 1}: 画像が見つかりません: ${p}`);
    }
    if (s.layout === "split" && !s._imgPath) {
      problems.push(`  slide ${i + 1}: split レイアウトには image が必須です`);
    }
  }
  if (problems.length) fail(`deck.json に問題があります:\n${problems.join("\n")}`);

  const warns = collectWarnings(slides);

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 インチ（16:9）
  pres.theme = { headFontFace: T.fontHead, bodyFontFace: T.fontBody };
  pres.title = deck.title ?? basename(deckDir);
  pres.author = "SlideSmith";

  const ctxBase = { brand: deck.brand ?? "", total: slides.length };
  slides.forEach((s, i) => {
    const slide = pres.addSlide();
    BUILDERS[s.layout](pres, slide, s, T, { ...ctxBase, pageNo: i + 1 });
    if (s.notes) slide.addNotes(s.notes);
  });

  const outDir = join(deckDir, "out");
  await mkdir(outDir, { recursive: true });
  const safeName = (deck.title ?? basename(deckDir)).replace(/[\/\\:*?"<>|]/g, "_").slice(0, 60);
  const outPath = join(outDir, `${safeName}.pptx`);
  await pres.writeFile({ fileName: outPath });

  console.log("PPTX生成完了！");
  console.log(`  テーマ   : ${themeName}`);
  console.log(`  スライド : ${slides.length}枚（${slides.map((s) => s.layout).join(" → ")}）`);
  console.log(`  出力先   : ${outPath}`);
  if (warns.length) {
    console.log("");
    console.log(`⚠ 文字量の警告（${warns.length}件。はみ出しの可能性。短くするのを推奨）:`);
    warns.forEach((w) => console.log(w));
  }
  console.log("");
  console.log("次のステップ:");
  console.log("  ・PowerPoint / Keynote: そのまま開いて編集");
  console.log("  ・Canva: ホーム →「アップロード」にこの .pptx をドラッグ → デザインとして編集");
}

main().catch((err) => {
  console.error(`予期しないエラー: ${err.message}`);
  process.exit(1);
});
