#!/usr/bin/env node
/* reference/layouts.md を engine/layouts.mjs から自動生成する（手で書くと枠の上限がずれるため）
   使い方: node scripts/layouts-doc.mjs   ※型を足したら必ず実行 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LAYOUTS } from '../engine/layouts.mjs';
import { ICON_NAMES } from '../engine/icons.mjs';

const fmt = (sp, ind = '') => Object.entries(sp).map(([k, v]) => {
  const req = v.req ? '必須' : '任意';
  if (v.kind === 'text') return `${ind}- \`${k}\`（${req}）${v.min ? v.min + '〜' : ''}${v.max}字${v.hint ? ' — ' + v.hint : ''}`;
  if (v.kind === 'list') return `${ind}- \`${k}\`（${req}）${v.min}〜${v.max}個` + (v.item.kind === 'obj' ? '\n' + fmt(v.item.fields, ind + '  ') : ` ／1個${v.item.max}字まで`);
  if (v.kind === 'obj') return `${ind}- \`${k}\`（${req}）\n${fmt(v.fields, ind + '  ')}`;
  if (v.kind === 'enum') return `${ind}- \`${k}\`（${req}）${v.values.length > 6 ? 'アイコン名（末尾の一覧から）' : '次から1つ: ' + v.values.join(' / ')}`;
  if (v.kind === 'num') return `${ind}- \`${k}\`（${req}）数字 ${v.min}〜${v.max}`;
  if (v.kind === 'img') return `${ind}- \`${k}\`（${req}）assets/ の画像パス。実物が無いと事前チェックで止まる`;
}).join('\n');

const md = `# 型の決定表と枠の一覧

> このファイルは \`node scripts/layouts-doc.mjs\` で自動生成（上半分の決定表だけは scripts/layouts-doc.mjs 内で編集）。

## 1. 決定表 — 中身の形から型を選ぶ

上から順に当てはまるか見て、最初に当てはまった型を使う。

| 中身の形（台本のどこを見るか） | 使う型 | 単調になったら（直前と同じ型のとき） |
|---|---|---|
| デッキの1枚目 | cover | — |
| 6枚以上のデッキの2枚目。章が3〜6個 | agenda | — |
| 章の切り替わり | section | — |
| 一番伝えたい数字が1つある（実績・量・削減） | big-number | message（evidence に数字） |
| 前と後・AとB・役割分担など「2つを並べて違いを見せる」 | compare（mode を選ぶ） | problem |
| 主役の数字が2〜4個並ぶ（会社の規模・KPI・実績） | stats | big-number（1つに絞る） |
| 数量が2〜6個あり、大小・推移を比べたい | bars（項目の比較=bar / 時期の推移=column） | big-number（1つに絞る） |
| 「項目：内容」の一覧（会社概要・開催概要・募集要項・症状→原因のような2列の対応） | spec | table（3列以上なら） |
| 2〜4つを複数の観点で見比べる（方式・プランの機能比較）。columns=比べる対象、rows.label=観点、cells=各対象の値 | table | compare（2つに絞る） |
| 段階ごとに数が減っていく（認知→問い合わせ→成約） | funnel | flow |
| 土台の上に積み上がる・階層・優先順位 | pyramid | features |
| 2つの軸で4つに分ける（位置づけ・どこから始めるか） | matrix | compare（mode=split） |
| 順番がある（手順・処理の流れ・判断の順） | flow | timeline（時期があるなら） |
| 時期・日付・フェーズがある（予定・ロードマップ） | timeline | flow |
| 困りごと・課題・なぜ難しいか（2〜4個） | problem | features |
| 実際の画面を見せたい、**かつ画像ファイルがある** | screenshot | 画像が無ければ compare / flow（空の枠は禁止） |
| いちばん言いたい一文・方針・まとめの一言 | message | photo（実物の写真があるとき） |
| 実物の写真で現場・空気を伝える、**かつ写真ファイルがある** | photo | message |
| 料金・プランを提示する（金額が決まっている） | pricing | table |
| 実在の利用者の声・導入事例（本人の言葉がある） | testimonial | big-number（成果の数字だけ） |
| 話し手・担当者を**1人**紹介 | profile | — |
| メンバーを**2〜4人**紹介 | team | — |
| 聞き手に考えてもらう問い・手を動かすワーク・クイズ | question | message |
| 実在の人の言葉を大きく見せる（出典がある引用） | quote | testimonial |
| 明日からやること・持ち物・作業前の確認 | checklist | summary |
| 導入前の不安・よくある質問（2〜4問） | faq | problem |
| 締めの直前の振り返り（要点3〜4個） | summary | message |
| 順序のない要点3〜4個（強み・ルール・安全策） | features（本文の25%まで） | problem（icon を付ける） |
| 最後の1枚。次にしてほしい行動 | closing | — |

### デッキ全体の決まり（事前チェックと機械検品が止める）
- 1枚目 cover、最後 closing。6枚以上なら2枚目 agenda
- **同じ型は2枚連続まで**（3枚目は「単調になったら」列の型へ）
- 本文スライド（cover / agenda / section / message / photo / question / quote / closing 以外）のうち **図解の型（big-number / stats / compare / flow / timeline / screenshot / bars / table / funnel / pyramid / matrix）を60%以上**。40%未満は止まる
- features（カード並べ）は本文の25%まで
- 8枚以上のデッキは暗い面（section / message / closing）を2枚以上。章の区切りに section、山場に message
- section の title は agenda の項目と同じ言葉にする。**section の直後は必ず中身のスライド**（章扉が続く・章扉のすぐ後が締めは止まる）
- **図解の割合を満たすために中身の無い図を作らない**（値が全部同じグラフは止まる。台本に数字が無ければ数字の型を選ばない）

### 言葉の決まり
- 見出し（title / message）は**述語まで書き切る**。「〜を原本と」「〜が正」のように途中で終わると止まる。言い切りの体言止めや「〜に。」は「。」を付ける
- 強調は \`*語*\` で1枚1〜2か所。改行したい位置は \`\\n\`
- 文字数が上限を超えたら**削る**。削れないなら項目を減らすか、2枚に分ける（小さくして詰め込む手段は無い）
- 目次・章扉の**見出しの言葉**は台本の流れを要約して作ってよい（構造の言葉）。ただし中身の事実は作らない
- 数字・金額・お客様の声・肩書きは台本にあるものだけ使う。台本に無いものを作らない（bars / funnel / pricing / testimonial / profile は特に注意）
- 画像を使う型（screenshot / photo / 写真つき profile・testimonial）は assets/ に実物があるときだけ

## 2. 型ごとの枠
${Object.entries(LAYOUTS).map(([id, L]) => `\n### ${id} — ${L.name}（${L.tone === 'dark' ? '暗い面' : '明るい面'}）\n${L.use}\n\n${fmt(L.spec)}`).join('\n')}

## 3. アイコン名
${ICON_NAMES.map(n => `\`${n}\``).join(' ')}
`;
writeFileSync(fileURLToPath(new URL('../reference/layouts.md', import.meta.url)), md);
console.log('✓ reference/layouts.md を生成');
