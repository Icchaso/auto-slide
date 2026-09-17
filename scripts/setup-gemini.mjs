#!/usr/bin/env node
/**
 * setup-gemini.mjs — Gemini APIキーの半自動セットアップ
 *
 * 使い方:
 *   node scripts/setup-gemini.mjs              # ガイド表示 + AI Studioをブラウザで開く
 *   node scripts/setup-gemini.mjs <APIキー>     # キーを検証して保存
 *   GEMINI_API_KEY=xxx node scripts/setup-gemini.mjs   # 環境変数のキーを検証して保存
 *
 * 保存先: ~/.config/slidesmith/credentials.json (mode 600)
 */

import { mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const AISTUDIO_URL = "https://aistudio.google.com/apikey";
const CONFIG_DIR = join(homedir(), ".config", "slidesmith");
const CREDENTIALS_PATH = join(CONFIG_DIR, "credentials.json");

function printHelp() {
  console.log(`setup-gemini.mjs — Gemini APIキーのセットアップ

使い方:
  node scripts/setup-gemini.mjs              ガイド表示（APIキー発行ページを開く）
  node scripts/setup-gemini.mjs <APIキー>     キーを検証して保存
  GEMINI_API_KEY=xxx node scripts/setup-gemini.mjs   環境変数のキーを検証して保存

保存先: ${CREDENTIALS_PATH}`);
}

function maskKey(key) {
  return key.slice(0, 4) + "***";
}

function showGuide() {
  console.log(`
=============================================
 Gemini APIキー セットアップガイド
=============================================

1. Google AI Studio のAPIキー発行ページを開きます
   ${AISTUDIO_URL}

2. Googleアカウントでログインし「APIキーを作成」を押す
   （無料枠あり。クレジットカード登録なしでも発行できます）

3. 発行されたキー（AIza... で始まる文字列）をコピーして、
   このあと表示される入力欄に貼り付けて Enter
   （入力は画面に表示されず、コマンド履歴にも残りません）

キーは ~/.config/slidesmith/credentials.json に保存され、
genimg.mjs（画像生成CLI）が自動で読み込みます。
`);
}

function openBrowser(url) {
  return new Promise((resolve) => {
    if (platform() !== "darwin") {
      resolve(false);
      return;
    }
    try {
      const child = spawn("open", [url], { stdio: "ignore" });
      child.on("error", () => resolve(false));
      child.on("exit", (code) => resolve(code === 0));
    } catch {
      resolve(false);
    }
  });
}

/** 安価な検証呼び出し: モデル一覧取得（トークン消費なし） */
async function validateKey(key) {
  let res;
  try {
    res = await fetch(`${API_BASE}/models?pageSize=1`, {
      headers: { "x-goog-api-key": key },
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    console.error("エラー: Gemini APIに接続できませんでした。ネットワーク接続を確認してください。");
    console.error(`詳細: ${err?.cause?.message ?? err.message}`);
    process.exit(1);
  }

  if (res.ok) return true;

  const bodyText = await res.text().catch(() => "");
  let apiMessage = "";
  try {
    apiMessage = JSON.parse(bodyText)?.error?.message ?? "";
  } catch {
    apiMessage = bodyText.slice(0, 200);
  }

  switch (res.status) {
    case 400:
    case 401:
    case 403:
      console.error(`エラー (HTTP ${res.status}): APIキーが正しくありません。`);
      console.error("キーのコピーミス（前後の空白・欠け）がないか確認し、");
      console.error(`${AISTUDIO_URL} で有効なキーを発行し直してください。`);
      break;
    case 429:
      console.error("エラー (HTTP 429): リクエスト上限（クォータ）に達しています。");
      console.error("キー自体は存在する可能性がありますが、時間をおいて再実行してください。");
      break;
    default:
      console.error(`エラー (HTTP ${res.status}): キーの検証に失敗しました。`);
  }
  if (apiMessage) console.error(`APIからのメッセージ: ${apiMessage}`);
  process.exit(1);
}

/** 対話式の非表示入力（打った文字を画面に出さない = シェル履歴にも残らない） */
function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer.trim());
    });
    // 入力内容のエコーバックを * に置き換える
    rl._writeToOutput = (str) => {
      if (str.startsWith(question)) rl.output.write(question);
      else if (str.includes("\n")) rl.output.write("");
      else rl.output.write("*");
    };
  });
}

/** 既存の credentials.json を保ったままマージ保存（OpenAIキー等を消さない） */
async function saveKey(key) {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  let current = {};
  try {
    current = JSON.parse(await readFile(CREDENTIALS_PATH, "utf8")) ?? {};
  } catch {
    // ファイルなし・破損は新規作成として扱う
  }
  current.gemini_api_key = key;
  await writeFile(CREDENTIALS_PATH, JSON.stringify(current, null, 2) + "\n", { mode: 0o600 });
  // 既存ファイル上書き時は mode オプションが効かないため明示的に絞る
  await chmod(CREDENTIALS_PATH, 0o600);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  let key = args[0]?.trim() || process.env.GEMINI_API_KEY?.trim();

  if (key && args[0]) {
    console.log("⚠ 注意: 引数でキーを渡すとシェル履歴（~/.zsh_history等）に残ります。");
    console.log("  次回からは引数なしで実行し、非表示の入力欄に貼り付ける方式を推奨します。");
    console.log("");
  }

  if (!key) {
    showGuide();
    const opened = await openBrowser(AISTUDIO_URL);
    if (opened) {
      console.log("→ ブラウザでAPIキー発行ページを開きました。");
    } else {
      console.log(`→ ブラウザを自動で開けませんでした。上記URLを手動で開いてください: ${AISTUDIO_URL}`);
    }
    if (!process.stdin.isTTY) {
      // 対話できない環境（パイプ実行等）では入力待ちにせず案内のみで終了
      console.log("→ キー発行後、ターミナルでもう一度このコマンドを実行してください。");
      return;
    }
    console.log("");
    key = await promptHidden("APIキーを貼り付けて Enter（画面には表示されません）: ");
    if (!key) {
      console.log("入力が空だったため終了します。発行後にもう一度実行してください。");
      return;
    }
  }

  console.log("APIキーを検証しています…");
  await validateKey(key);
  await saveKey(key);
  console.log("");
  console.log("セットアップ完了！");
  console.log(`  キー     : ${maskKey(key)}（有効性を確認済み）`);
  console.log(`  保存先   : ${CREDENTIALS_PATH}`);
  console.log("");
  console.log("画像生成を試すには:");
  console.log('  node scripts/genimg.mjs "青い空と白い雲" test.png --style corporate --ar 16:9');
}

main().catch((err) => {
  console.error(`予期しないエラー: ${err.message}`);
  process.exit(1);
});
