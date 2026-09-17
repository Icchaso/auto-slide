# 見本（台本 → deck.json → 完成画像）

deck.json を書く前に、**用途の近い見本を1つ開いて形式を真似る**。
各フォルダの `deck.json` の `notes` に「なぜこの型にしたか」を書いてある。

| フォルダ | テーマ | 枚数 | 見どころ |
|---|---|---|---|
| `inquiry-ai-proposal/` | fresh | 15 | 提案書の王道。章立て（agenda → section）・数字の内訳は bars・減っていく数は funnel・方針は message・料金は pricing |
| `cafe-workshop/` | warm | 9 | 短い告知資料。縦棒グラフ・積み上げの pyramid・お客様の声・料金が1つだけのときは flow の goal に入れる |

それぞれ `script.md`（台本）・`deck.json`（中身）・`sheet.jpg`（完成の一覧）がある。
描き直すとき: `node scripts/build.mjs reference/examples/<フォルダ>`（html/ と out/ は git に入らない）

## 見本から学ぶ「台本 → 型」の読み方
- 台本に**数字が並んでいる** → 大小を比べるなら bars、段階で減るなら funnel、1つだけなら big-number
- 台本に「**一番大事なのは〜その上に〜**」 → pyramid（上の段から書く）
- 台本に「**大事な方針**」「**つまり**」 → message（暗い面にして山場を作る）
- 台本に**前と後** → compare（before-after）
- 台本に**順番**（1か月目・前半後半・まず〜次に） → 時期なら timeline、手順なら flow
- 料金が**2つ以上** → pricing、**1つだけ** → flow の goal や closing の subtitle に書く
- 事前チェックで「図解の型が本文の◯%」と止まったら、文章の枚（problem・features・faq）を減らすか図解の型に振り替える（cafe-workshop は faq をやめて答えを flow の本文に入れた）
