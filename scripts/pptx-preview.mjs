#!/usr/bin/env node
/**
 * pptx-preview.mjs — 生成した.pptxをPowerPoint/Keynoteで開き、全スライドをPNG書き出しする
 *
 * 使い方:
 *   node scripts/pptx-preview.mjs <デッキフォルダ>      # <フォルダ>/out/ の最新.pptxをプレビュー
 *   node scripts/pptx-preview.mjs <ファイル.pptx>       # 直接指定
 *
 * 出力: <pptxと同じフォルダ>/preview/slide-01.png, slide-02.png, ...
 *
 * 用途: デザインレビュー修正ループ（SKILL.md「PPTX出力ルート」STEP 4）。
 * pptxgenjsの座標計算ではなく**PowerPointの実レンダリング**を確認できるのが要点。
 *
 * ※ 初回実行時、macOSが「PowerPoint（またはKeynote）の制御を許可しますか」と
 *    確認ダイアログを出す。「OK」を押してもらうこと（拒否すると -1743 エラーになる）。
 */

import { readdir, mkdir, rm, rename, stat } from "node:fs/promises";
import { join, resolve, extname, dirname, basename } from "node:path";
import { spawnSync } from "node:child_process";

function fail(message) {
  console.error(`エラー: ${message}`);
  process.exit(1);
}

async function findLatestPptx(dir) {
  const outDir = join(dir, "out");
  let entries;
  try {
    entries = await readdir(outDir);
  } catch {
    fail(`${outDir} が見つかりません。先に node scripts/pptx.mjs <デッキフォルダ> を実行してください。`);
  }
  const pptxFiles = entries.filter((f) => f.toLowerCase().endsWith(".pptx"));
  if (pptxFiles.length === 0) {
    fail(`${outDir} に .pptx がありません。先に node scripts/pptx.mjs <デッキフォルダ> を実行してください。`);
  }
  let latest = null;
  let latestMtime = 0;
  for (const f of pptxFiles) {
    const s = await stat(join(outDir, f));
    if (s.mtimeMs > latestMtime) {
      latestMtime = s.mtimeMs;
      latest = join(outDir, f);
    }
  }
  return latest;
}

function runOsascript(script) {
  const res = spawnSync("osascript", ["-e", script], { encoding: "utf8", timeout: 180000 });
  return { ok: res.status === 0, stderr: (res.stderr ?? "").trim() };
}

function exportWithPowerPoint(pptxPath, previewDir) {
  return runOsascript(`
tell application "Microsoft PowerPoint"
  open (POSIX file "${pptxPath}")
  save active presentation in (POSIX file "${previewDir}") as save as PNG
  close active presentation saving no
end tell`);
}

function exportWithKeynote(pptxPath, previewDir) {
  return runOsascript(`
tell application "Keynote"
  activate
  delay 3
  set theDoc to open (POSIX file "${pptxPath}")
  delay 5
  export theDoc to (POSIX file "${previewDir}") as slide images with properties {image format:PNG}
  close theDoc saving no
end tell`);
}

/** 書き出しファイル名はアプリ・言語で変わる（スライド1.PNG / Slide1.png 等）→ 連番に正規化 */
async function normalizeNames(previewDir) {
  const files = (await readdir(previewDir)).filter((f) => f.toLowerCase().endsWith(".png"));
  const numbered = files
    .map((f) => ({ f, n: Number((f.match(/(\d+)/) ?? [])[1] ?? NaN) }))
    .filter((x) => !Number.isNaN(x.n))
    .sort((a, b) => a.n - b.n);
  for (const [i, { f }] of numbered.entries()) {
    const name = `slide-${String(i + 1).padStart(2, "0")}.png`;
    if (f !== name) await rename(join(previewDir, f), join(previewDir, name));
  }
  return numbered.length;
}

async function main() {
  const arg = process.argv[2];
  if (!arg || arg === "--help" || arg === "-h") {
    console.log(`pptx-preview.mjs — .pptxの全スライドをPNG書き出し（実レンダリング確認用）

使い方:
  node scripts/pptx-preview.mjs <デッキフォルダ>   # out/ の最新.pptxをプレビュー
  node scripts/pptx-preview.mjs <ファイル.pptx>    # 直接指定

出力先: <pptxと同じフォルダ>/preview/slide-NN.png`);
    return;
  }

  const target = resolve(arg);
  const pptxPath =
    extname(target).toLowerCase() === ".pptx" ? target : await findLatestPptx(target);
  try {
    await stat(pptxPath);
  } catch {
    fail(`ファイルが見つかりません: ${pptxPath}`);
  }

  const previewDir = join(dirname(pptxPath), "preview");
  await rm(previewDir, { recursive: true, force: true }); // 前回のプレビューを一掃（生成物のみのフォルダ）
  await mkdir(previewDir, { recursive: true });

  console.log(`対象   : ${basename(pptxPath)}`);
  console.log("PowerPointでPNG書き出し中…（初回はアプリ起動で10〜20秒かかります）");

  let result = exportWithPowerPoint(pptxPath, previewDir);
  let renderer = "PowerPoint";
  let count = result.ok ? await normalizeNames(previewDir) : 0;

  if (!result.ok || count === 0) {
    if (result.stderr) console.log(`PowerPoint失敗（${result.stderr.slice(0, 120)}）→ Keynoteで再試行…`);
    else console.log("PowerPointで書き出せなかったため、Keynoteで再試行…");
    result = exportWithKeynote(pptxPath, previewDir);
    renderer = "Keynote";
    count = result.ok ? await normalizeNames(previewDir) : 0;
  }

  if (!result.ok || count === 0) {
    console.error("エラー: PNG書き出しに失敗しました。");
    if (result.stderr) console.error(`詳細: ${result.stderr.slice(0, 300)}`);
    if (/-1743|not allowed|許可/.test(result.stderr)) {
      console.error("");
      console.error("原因はmacOSの自動化許可です。次の手順で許可してください:");
      console.error("  システム設定 → プライバシーとセキュリティ → オートメーション");
      console.error("  → ターミナル（またはClaude）→ Microsoft PowerPoint / Keynote をオン");
    }
    process.exit(1);
  }

  console.log("");
  console.log(`書き出し完了！（${renderer}の実レンダリング）`);
  console.log(`  枚数   : ${count}枚`);
  console.log(`  出力先 : ${previewDir}/slide-01.png 〜 slide-${String(count).padStart(2, "0")}.png`);
  console.log("");
  console.log("次: 全枚をReadで開き、はみ出し・重なり・余白・可読性をチェック（SKILL.md参照）");
}

main().catch((err) => {
  console.error(`予期しないエラー: ${err.message}`);
  process.exit(1);
});
