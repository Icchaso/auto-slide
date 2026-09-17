#!/usr/bin/env node
/**
 * genimg.mjs — AI画像生成CLI（3プロバイダ対応）
 *
 *   既定      Gemini（gemini-2.5-flash-image・要APIキー）
 *   --free    Pollinations.ai（無料・キー不要）
 *   --openai  OpenAI gpt-image-2（最高品質・要APIキー＋課金設定）
 *
 * 使い方:
 *   node scripts/genimg.mjs "<日本語プロンプト>" <出力.png> [--style <テーマ名>] [--ar 16:9|1:1|3:4|4:3]
 *   node scripts/genimg.mjs --list-styles
 *
 * APIキーの取得順: 環境変数（GEMINI_API_KEY / OPENAI_API_KEY）→ ~/.config/slidesmith/credentials.json
 * キー未設定の場合は setup-gemini.mjs / setup-openai.mjs の実行を案内します。
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname, resolve } from "node:path";

const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const CREDENTIALS_PATH = join(homedir(), ".config", "slidesmith", "credentials.json");

/** OpenAI gpt-image-2（最高品質。要APIキー＋課金設定） */
const OPENAI_MODEL = "gpt-image-2";
const OPENAI_ENDPOINT = "https://api.openai.com/v1/images/generations";
const OPENAI_QUALITIES = ["low", "medium", "high"];
const DEFAULT_OPENAI_QUALITY = "medium";
/** gpt-image-2のサイズ指定: 幅・高さとも16の倍数が必須。[標準, --hd] の2段 */
const OPENAI_AR_SIZE = {
  "16:9": [[1536, 864], [2560, 1440]],
  "1:1": [[1024, 1024], [1440, 1440]],
  "3:4": [[960, 1280], [1440, 1920]],
  "4:3": [[1280, 960], [1920, 1440]],
  "9:16": [[864, 1536], [1440, 2560]],
  "3:2": [[1440, 960], [2160, 1440]],
  "2:3": [[960, 1440], [1440, 2160]],
  "21:9": [[1680, 720], [2352, 1008]],
  "5:4": [[1280, 1024], [1600, 1280]],
  "4:5": [[1024, 1280], [1280, 1600]],
};

/** 無料プロバイダ: Pollinations.ai（キー・課金不要。品質はGeminiに一歩譲る） */
const FREE_ENDPOINT = "https://image.pollinations.ai/prompt/";
const AR_SIZE = {
  "16:9": [1920, 1080], "1:1": [1080, 1080], "3:4": [1080, 1440], "4:3": [1440, 1080],
  "9:16": [1080, 1920], "3:2": [1620, 1080], "2:3": [1080, 1620], "21:9": [2520, 1080],
  "5:4": [1350, 1080], "4:5": [1080, 1350],
};

/** テーマ名 → 画風レシピ（プロンプトに追記する英語スタイル指定） */
const STYLES = {
  corporate: "clean corporate photography, soft natural light, shallow depth of field, muted navy and teal tones",
  pop: "vibrant flat illustration style, bold colors, playful, sticker-like",
  elegant: "quiet luxury photography, dark moody tones, gold accents, japanese aesthetics, tranquil",
  minimal: "minimalist photography, white background, single object, strong shadow, monochrome",
  tech: "futuristic 3D render, dark background, neon cyan glow, sleek",
  warm: "film photography, warm natural light, cozy, earthy tones, kinfolk style",
  feminine: "soft airy photography, pastel tones, delicate, high-key light",
  retro: "showa era retro japan, nostalgic film photo, warm faded colors",
};

/** 文字混入防止の共通追記 */
const NO_TEXT_SUFFIX = "no text, no letters, no watermark";

const SUPPORTED_AR = ["16:9", "1:1", "3:4", "4:3", "9:16", "3:2", "2:3", "21:9", "5:4", "4:5"];
const DEFAULT_AR = "16:9";

function printHelp() {
  console.log(`genimg.mjs — Gemini画像生成CLI（モデル: ${MODEL}）

使い方:
  node scripts/genimg.mjs "<日本語プロンプト>" <出力.png> [--style <テーマ名>] [--ar <比率>]
  node scripts/genimg.mjs --list-styles

オプション:
  --style <名前>   画風テーマ（--list-styles で一覧表示）
  --ar <比率>      アスペクト比: 16:9 | 1:1 | 3:4 | 4:3 など（既定: ${DEFAULT_AR}）
  --free           無料プロバイダ（Pollinations.ai）で生成。キー・課金不要
  --openai         OpenAI gpt-image-2 で生成（最高品質・要APIキー＋課金設定）
  --quality <q>    gpt-image-2の品質: low | medium | high（既定: ${DEFAULT_OPENAI_QUALITY}。--openai時のみ）
  --hd             gpt-image-2を高解像度（16:9なら2560x1440）で生成。料金も上がる（--openai時のみ）
  --list-styles    内蔵スタイル8種を表示
  --help           このヘルプを表示

プロバイダ:
  既定     Gemini（高品質・要APIキー＋課金設定・1枚約$0.039）
  --free   Pollinations.ai（無料・キー不要。品質は一歩譲るが十分実用的）
  --openai OpenAI gpt-image-2（最高品質・要APIキー＋課金設定。
           目安: medium 約$0.04〜/枚, high 約$0.17〜/枚。--hd はさらに増える）

例:
  node scripts/genimg.mjs "会議室で談笑するビジネスパーソン" hero.png --style corporate --ar 16:9

※ 生成画像には自動で「${NO_TEXT_SUFFIX}」を追記します（文字混入防止）。`);
}

function printStyles() {
  console.log("内蔵スタイル一覧（--style で指定）:\n");
  for (const [name, recipe] of Object.entries(STYLES)) {
    console.log(`  ${name.padEnd(10)} ${recipe}`);
  }
  console.log(`\n計 ${Object.keys(STYLES).length} スタイル`);
}

async function loadApiKey() {
  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (envKey) return envKey;

  try {
    const raw = await readFile(CREDENTIALS_PATH, "utf8");
    const key = JSON.parse(raw)?.gemini_api_key?.trim();
    if (key) return key;
  } catch {
    // ファイルなし・破損は下のエラーメッセージに集約
  }

  console.error("エラー: Gemini APIキーが見つかりません。");
  console.error("まず次のコマンドでセットアップしてください:");
  console.error("  node scripts/setup-gemini.mjs");
  console.error("（または環境変数 GEMINI_API_KEY を設定してください）");
  process.exit(1);
}

async function loadOpenAIKey() {
  const envKey = process.env.OPENAI_API_KEY?.trim();
  if (envKey) return envKey;

  try {
    const raw = await readFile(CREDENTIALS_PATH, "utf8");
    const key = JSON.parse(raw)?.openai_api_key?.trim();
    if (key) return key;
  } catch {
    // ファイルなし・破損は下のエラーメッセージに集約
  }

  console.error("エラー: OpenAI APIキーが見つかりません。");
  console.error("まず次のコマンドでセットアップしてください:");
  console.error("  node scripts/setup-openai.mjs");
  console.error("（または環境変数 OPENAI_API_KEY を設定してください）");
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  let style = null;
  let ar = DEFAULT_AR;
  let free = false;
  let openai = false;
  let quality = DEFAULT_OPENAI_QUALITY;
  let hd = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") return { mode: "help" };
    if (a === "--list-styles") return { mode: "list-styles" };
    if (a === "--free") { free = true; continue; }
    if (a === "--openai") { openai = true; continue; }
    if (a === "--hd") { hd = true; continue; }
    if (a === "--quality") {
      quality = argv[++i];
      if (!quality || !OPENAI_QUALITIES.includes(quality)) {
        fail(`--quality は ${OPENAI_QUALITIES.join(" | ")} のいずれかを指定してください`);
      }
      continue;
    }
    if (a === "--style") {
      style = argv[++i];
      if (!style) fail("--style にテーマ名を指定してください（--list-styles で一覧表示）");
      continue;
    }
    if (a === "--ar") {
      ar = argv[++i];
      if (!ar) fail("--ar にアスペクト比を指定してください（例: 16:9）");
      continue;
    }
    if (a.startsWith("--")) fail(`不明なオプション: ${a}（--help で使い方を表示）`);
    positional.push(a);
  }

  if (positional.length < 2) {
    fail('引数が不足しています。使い方: node scripts/genimg.mjs "<プロンプト>" <出力.png> [--style <名前>] [--ar 16:9]\n--help で詳細を表示します。');
  }
  if (style && !STYLES[style]) {
    fail(`不明なスタイル: ${style}\n利用可能: ${Object.keys(STYLES).join(", ")}`);
  }
  if (!SUPPORTED_AR.includes(ar)) {
    fail(`未対応のアスペクト比: ${ar}\n利用可能: ${SUPPORTED_AR.join(", ")}`);
  }
  if (free && openai) {
    fail("--free と --openai は同時に指定できません（どちらか1つ）");
  }

  return { mode: "generate", prompt: positional[0], outPath: resolve(positional[1]), style, ar, free, openai, quality, hd };
}

function fail(message) {
  console.error(`エラー: ${message}`);
  process.exit(1);
}

function buildPrompt(userPrompt, styleName) {
  const parts = [userPrompt];
  if (styleName) parts.push(STYLES[styleName]);
  parts.push(NO_TEXT_SUFFIX);
  return parts.join(", ");
}

async function handleHttpError(res) {
  const bodyText = await res.text().catch(() => "");
  let apiMessage = "";
  try {
    apiMessage = JSON.parse(bodyText)?.error?.message ?? "";
  } catch {
    apiMessage = bodyText.slice(0, 300);
  }

  switch (res.status) {
    case 400:
    case 401:
    case 403:
      console.error(`エラー (HTTP ${res.status}): APIキーが不正、またはリクエスト内容に問題があります。`);
      console.error("node scripts/setup-gemini.mjs でキーを設定し直してみてください。");
      break;
    case 429:
      console.error("エラー (HTTP 429): リクエスト上限（クォータ）に達しました。");
      console.error("無料枠の場合は数分〜24時間待つか、有料プランへの切り替えを検討してください。");
      break;
    case 500:
    case 502:
    case 503:
      console.error(`エラー (HTTP ${res.status}): Gemini側のサーバーエラーです。少し待って再実行してください。`);
      break;
    default:
      console.error(`エラー (HTTP ${res.status}): 画像生成に失敗しました。`);
  }
  if (apiMessage) console.error(`APIからのメッセージ: ${apiMessage}`);
  process.exit(1);
}

function extractImage(data) {
  // 安全フィルタでブロックされたケース
  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) {
    console.error(`エラー: プロンプトが安全フィルタでブロックされました（理由: ${blockReason}）。`);
    console.error("表現をマイルドにする・固有名詞や人物指定を外す、などプロンプトを調整して再実行してください。");
    process.exit(1);
  }

  const candidate = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const parts = candidate?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);

  if (!imagePart) {
    if (finishReason && finishReason !== "STOP") {
      console.error(`エラー: 画像が生成されませんでした（finishReason: ${finishReason}）。`);
      if (finishReason === "IMAGE_SAFETY" || finishReason === "SAFETY" || finishReason === "PROHIBITED_CONTENT") {
        console.error("安全フィルタによるブロックです。プロンプトの表現を調整して再実行してください。");
      }
    } else {
      const text = parts.find((p) => p.text)?.text;
      console.error("エラー: レスポンスに画像データ（inlineData）が含まれていませんでした。");
      if (text) console.error(`モデルの応答テキスト: ${text.slice(0, 300)}`);
    }
    process.exit(1);
  }
  return imagePart.inlineData;
}

/** 無料プロバイダ（Pollinations.ai）での生成 */
async function generateFree({ prompt, outPath, style, ar }) {
  const fullPrompt = buildPrompt(prompt, style);
  const [width, height] = AR_SIZE[ar];
  const seed = Math.floor(Math.random() * 1e9); // 同一プロンプトでも毎回違う絵にする
  const url = `${FREE_ENDPOINT}${encodeURIComponent(fullPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux&enhance=true`;

  console.log("プロバイダ   : Pollinations.ai（無料・キー不要）");
  console.log(`アスペクト比 : ${ar}（${width}x${height}）`);
  if (style) console.log(`スタイル     : ${style}`);
  console.log(`プロンプト   : ${fullPrompt}`);
  console.log("画像を生成しています…（20〜60秒ほどかかります）");

  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(180000) });
  } catch (err) {
    console.error("エラー: Pollinations.ai に接続できませんでした。ネットワークを確認して再実行してください。");
    console.error(`詳細: ${err?.cause?.message ?? err.message}`);
    process.exit(1);
  }
  if (!res.ok) {
    console.error(`エラー (HTTP ${res.status}): 無料プロバイダでの生成に失敗しました。`);
    console.error("混雑している可能性があります。少し待って再実行してください。");
    process.exit(1);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 10000) {
    console.error("エラー: 生成結果が画像として小さすぎます（サービス側の一時エラーの可能性）。再実行してください。");
    process.exit(1);
  }
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buffer);

  console.log("");
  console.log("生成完了！（無料）");
  console.log(`  出力先     : ${outPath}`);
  console.log(`  サイズ     : ${(buffer.length / 1024).toFixed(1)} KB`);
}

/** OpenAI gpt-image-2 での生成 */
async function generateOpenAI({ prompt, outPath, style, ar, quality, hd }) {
  const apiKey = await loadOpenAIKey();
  const fullPrompt = buildPrompt(prompt, style);
  const [width, height] = OPENAI_AR_SIZE[ar][hd ? 1 : 0];

  console.log(`モデル       : ${OPENAI_MODEL}（OpenAI）`);
  console.log(`アスペクト比 : ${ar}（${width}x${height}${hd ? "・HD" : ""}）`);
  console.log(`品質         : ${quality}`);
  if (style) console.log(`スタイル     : ${style}`);
  console.log(`プロンプト   : ${fullPrompt}`);
  console.log("画像を生成しています…（20〜90秒ほどかかります）");

  let res;
  try {
    res = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        prompt: fullPrompt,
        size: `${width}x${height}`,
        quality,
        n: 1,
      }),
      signal: AbortSignal.timeout(180000),
    });
  } catch (err) {
    console.error("エラー: OpenAI APIに接続できませんでした。ネットワーク接続を確認してください。");
    console.error(`詳細: ${err?.cause?.message ?? err.message}`);
    process.exit(1);
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    let apiMessage = "";
    let apiCode = "";
    try {
      const parsed = JSON.parse(bodyText)?.error;
      apiMessage = parsed?.message ?? "";
      apiCode = parsed?.code ?? "";
    } catch {
      apiMessage = bodyText.slice(0, 300);
    }
    switch (res.status) {
      case 401:
      case 403:
        console.error(`エラー (HTTP ${res.status}): APIキーが不正です。`);
        console.error("node scripts/setup-openai.mjs でキーを設定し直してください。");
        break;
      case 429:
        if (apiCode === "insufficient_quota") {
          console.error("エラー: クレジット残高が不足しています（課金未設定の可能性）。");
          console.error("https://platform.openai.com/settings/organization/billing でクレジットを購入してください。");
        } else {
          console.error("エラー (HTTP 429): リクエスト上限に達しました。少し待って再実行してください。");
        }
        break;
      case 400:
        console.error("エラー (HTTP 400): リクエスト内容に問題があります（安全フィルタまたはパラメータ）。");
        console.error("プロンプトの表現を調整して再実行してください。");
        break;
      case 500:
      case 502:
      case 503:
        console.error(`エラー (HTTP ${res.status}): OpenAI側のサーバーエラーです。少し待って再実行してください。`);
        break;
      default:
        console.error(`エラー (HTTP ${res.status}): 画像生成に失敗しました。`);
    }
    if (apiMessage) console.error(`APIからのメッセージ: ${apiMessage}`);
    process.exit(1);
  }

  const data = await res.json().catch(() => {
    fail("レスポンスのJSON解析に失敗しました。");
  });
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) {
    console.error("エラー: レスポンスに画像データ（b64_json）が含まれていませんでした。");
    process.exit(1);
  }

  const buffer = Buffer.from(b64, "base64");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buffer);

  console.log("");
  console.log("生成完了！（gpt-image-2）");
  console.log(`  出力先     : ${outPath}`);
  console.log(`  サイズ     : ${(buffer.length / 1024).toFixed(1)} KB`);
  if (data?.usage?.total_tokens) {
    console.log(`  消費トークン: ${data.usage.total_tokens}`);
  }
}

async function generate({ prompt, outPath, style, ar }) {
  const apiKey = await loadApiKey();
  const fullPrompt = buildPrompt(prompt, style);

  console.log(`モデル       : ${MODEL}`);
  console.log(`アスペクト比 : ${ar}`);
  if (style) console.log(`スタイル     : ${style}`);
  console.log(`プロンプト   : ${fullPrompt}`);
  console.log("画像を生成しています…（10〜30秒ほどかかります）");

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: ar },
        },
      }),
      signal: AbortSignal.timeout(120000),
    });
  } catch (err) {
    console.error("エラー: Gemini APIに接続できませんでした。ネットワーク接続を確認してください。");
    console.error(`詳細: ${err?.cause?.message ?? err.message}`);
    process.exit(1);
  }

  if (!res.ok) await handleHttpError(res);

  const data = await res.json().catch(() => {
    fail("レスポンスのJSON解析に失敗しました。");
  });
  const inlineData = extractImage(data);

  const buffer = Buffer.from(inlineData.data, "base64");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buffer);

  const sizeKb = (buffer.length / 1024).toFixed(1);
  console.log("");
  console.log("生成完了！");
  console.log(`  出力先     : ${outPath}`);
  console.log(`  サイズ     : ${sizeKb} KB（${inlineData.mimeType ?? "image/png"}）`);
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.mode === "help") return printHelp();
  if (parsed.mode === "list-styles") return printStyles();
  if (parsed.free) return generateFree(parsed);
  if (parsed.openai) return generateOpenAI(parsed);
  await generate(parsed);
}

main().catch((err) => {
  console.error(`予期しないエラー: ${err.message}`);
  process.exit(1);
});
