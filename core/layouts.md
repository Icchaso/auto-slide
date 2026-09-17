# SlideSmith レイアウトカタログ（12種）

スライド1枚 = HTMLファイル1枚。**必ずこのカタログのスニペット通りに書く**こと。
独自レイアウトの発明は禁止（品質が崩れる唯一の原因になる）。

## 共通ルール

- 冒頭で `core/base.css` → テーマCSS の順に読み込む（相対パスはデッキ置き場から調整）
- ルートは `<div class="slide">`。カバー系は `l-cover` / `l-section` / `l-closing` ＋ `on-cover` を追加
- 全スライドに `.brand`（左下）と `.pageno`（右下、01始まりゼロ埋め）を入れる
- 強調したい語は `<em>` で囲む（テーマがアクセント色やマーカーで装飾する）
- 装飾要素は必ず `class="deco ..."` を付ける（QCの対象外になる）
- 文字量の目安を超えない（はみ出しはQCで検出されるが、詰め込みすぎは検出前に避ける）

```html
<link rel="stylesheet" href="../../core/base.css">
<link rel="stylesheet" href="../../themes/＜テーマ名＞.css">
<div class="slide">
  ...レイアウト本体...
  <div class="brand"><span class="mark"></span>ブランド名</div>
  <div class="pageno">01</div>
</div>
```

---

## 1. cover — 表紙

```html
<div class="slide l-cover on-cover">
  <!-- テーマ固有の deco をここに（例: <div class="deco deco-orb"></div>） -->
  <div class="cover-meta">会社名・イベント名など（20字以内）</div>
  <div class="cover-body">
    <div class="eyebrow">英語のアイキャッチ（3語程度）</div>
    <h1 class="cover-title">タイトル1行目<br><em>強調語</em>を含む2行目</h1>
    <div class="cover-rule"></div>
    <p class="cover-sub">サブコピー。2行・80字以内。</p>
  </div>
  <div class="brand">...</div><div class="pageno">01</div>
</div>
```
文字量: タイトル 2行×12字以内 / サブ 80字以内

## 2. agenda — 目次

```html
<div class="slide">
  <div class="head">
    <div class="kicker">AGENDA</div>
    <h2>本日お話しすること</h2>
  </div>
  <ol class="agenda">
    <li><div><div class="t">項目タイトル</div><div class="d">補足（任意・30字以内）</div></div></li>
    <!-- 4〜6項目 -->
  </ol>
  ...brand/pageno...
</div>
```

## 3. section — 章扉

```html
<div class="slide l-section on-cover">
  <div class="section-num">01</div>
  <div class="section-body">
    <div class="eyebrow">SECTION 01</div>
    <h2 class="section-title">章タイトル（15字以内）</h2>
    <p class="section-sub">章の導入文。60字以内。</p>
  </div>
  ...brand/pageno...
</div>
```

## 4. cards — カード並列（要点2〜4個）

```html
<div class="slide">
  <div class="head">
    <div class="kicker">英語キッカー</div>
    <h2>見出し（<em>強調</em>可）</h2>
    <p class="lead">リード文（任意・60字以内）</p>
  </div>
  <div class="cards" style="--cols: 3;">
    <div class="card">
      <div class="badge">1</div>  <!-- 絵文字なら class="badge icon" -->
      <h3>カード見出し（2行まで）</h3>
      <p>本文。60字以内。</p>
    </div>
    <!-- --cols と同数 -->
  </div>
  ...brand/pageno...
</div>
```

## 5. list — 縦リスト（3〜4行）

```html
<div class="slide">
  <div class="head">...</div>
  <ul class="vlist">
    <li>
      <div class="badge">1</div>
      <h3>行タイトル（15字以内）</h3>
      <p>説明。48字以内。</p>
    </li>
    <!-- 3〜4行。4行なら説明は38字以内 -->
  </ul>
  ...brand/pageno...
</div>
```

## 6. compare — 対比（Before/After・良し悪し）

```html
<div class="slide">
  <div class="head">...</div>
  <div class="compare">
    <div class="panel">
      <div class="panel-head">😢 悪い側の名前</div>
      <ul><li>項目（22字以内）</li><!-- 3〜5個 --></ul>
    </div>
    <div class="panel is-good">
      <div class="panel-head">😊 良い側の名前</div>
      <ul><li>項目</li></ul>
    </div>
    <div class="vs">VS</div>  <!-- 任意 -->
  </div>
  ...brand/pageno...
</div>
```

## 7. steps — 手順（3〜4段）

```html
<div class="slide">
  <div class="head">...</div>
  <div class="steps" style="--cols: 3;">
    <div class="step">
      <div class="badge">1</div>
      <h3>手順名（12字以内）</h3>
      <p>説明。52字以内。</p>
      <div class="note">補足ラベル（任意・15字以内）</div>
    </div>
  </div>
  ...brand/pageno...
</div>
```

## 8. stats — 数字インパクト（2〜4個）

```html
<div class="slide">
  <div class="head">...</div>
  <div class="stats" style="--cols: 3;">
    <div class="stat">
      <div class="label">指標名（15字以内）</div>
      <div class="value">8.4<span class="unit">倍</span></div>
      <div class="desc">補足。35字以内。</div>
    </div>
  </div>
  ...brand/pageno...
</div>
```

## 9. quote — 引用・キーメッセージ

```html
<div class="slide">
  <div class="quote-wrap">
    <div class="quote-mark">“</div>  <!-- 実際の「引用・発言・お客様の声」のときだけ。キーメッセージなら削除 -->
    <p class="quote-text">引用文やキーメッセージ。<em>強調</em>可。55字以内。</p>
    <div class="quote-who">出典・発言者（任意）</div>
  </div>
  ...brand/pageno...
</div>
```
- 引用符（quote-mark）は**誰かの言葉を引用するときの記号**。自分のメッセージを言い切る枚では付けない

## 10. media — テキスト + ビジュアル枠

```html
<div class="slide">
  <div class="head">...</div>
  <div class="media-grid">
    <div class="media-copy">
      <h3>小見出し（20字以内）</h3>
      <p>本文段落（任意・80字以内）</p>
      <ul><li>箇条書き（任意・3個まで）</li></ul>
    </div>
    <div class="media-box">
      <img src="画像パス">  <!-- 画像がなければ ↓ -->
      <!-- <div class="placeholder">IMAGE</div> -->
    </div>
  </div>
  ...brand/pageno...
</div>
```

## 11. table — 表（3列×4行まで）

```html
<div class="slide">
  <div class="head">...</div>
  <div class="tablewrap">
    <table class="simple">
      <thead><tr><th></th><th>列A</th><th>列B</th></tr></thead>
      <tbody>
        <tr><th>行名</th><td>値</td><td class="hot">強調値</td></tr>
      </tbody>
    </table>
  </div>
  ...brand/pageno...
</div>
```

## 12. closing — 締め・CTA

```html
<div class="slide l-closing on-cover">
  <div class="closing-wrap">
    <div class="eyebrow">英語のアイキャッチ</div>
    <h2 class="closing-title">締めのメッセージ<br><em>強調語</em>入り。2行以内。</h2>
    <p class="closing-sub">補足・次のアクション案内。2行以内。</p>
    <div class="closing-cta">CTAボタン文言 →</div>  <!-- 任意 -->
  </div>
  ...brand/pageno...
</div>
```

---

# ★ リッチレイアウト（Phase 2）— プロ級の主役たち

## レイヤーシステム（全レイアウトで併用可）

「奥行き」を作る4層。**1デッキに最低2枚**はレイヤーを効かせること。

```html
<!-- 層1: 紙テクスチャ（ドット方眼）。ほぼ全スライドに置いてよい -->
<div class="deco layer-texture"></div>

<!-- 層2: 透かしタイポ。主役数字やキーワードを巨大アウトラインで背景に -->
<div class="deco ghost" style="right:-30px; bottom:-60px;">×8.4</div>

<!-- 層4: 手書き風注釈。図解の親要素（.viz など position:relative）の中に置く -->
<div class="annot" style="left:-8px; top:-64px;">主役はこの数字！</div>
```

### 🚫 ghost の配置ルール（違反すると「ミス」に見える）
1. **前景のカード・チップ・図解と重ねない**。カードの隙間から透かしが覗くと事故に見える。
   置くのは「何もない象限」（例: hero-statで右にカードがあるなら左下の余白）
2. **長い文字列は縮小する**。5文字前後なら `font-size:300px;` をinlineで指定（デフォルト360pxは3〜4字用）
3. はみ出しは1〜2辺まで。中途半端に文字が切れて読めないのはNG（大きく堂々と切れるのはOK）
4. レンダリング後、ghostが「わざとの演出」に見えるか自問する。少しでも事故っぽければ移動か削除

## 13. hero-stat — ヒーロー数字（左=語り / 右=ドーナツ図解）

一番伝えたい数字が1つあるときの最強レイアウト。stats（8番）より優先して使う。

```html
<div class="slide">
  <div class="deco layer-texture"></div>
  <div class="deco ghost" style="right:-30px; bottom:-60px;">主役数字</div>
  <div class="hero-grid">
    <div class="story">
      <div class="kicker">英語キッカー ── 期間など</div>
      <h2>見出し2行、<br><em>強調語</em>入り。</h2>
      <p class="body">語り。70字以内。</p>
      <div class="note">出典・注記（25字以内）</div>
    </div>
    <div class="viz">
      <div class="annot" style="left:-8px; top:-64px;">注釈（10字以内）</div>
      <div class="hero-card">
        <div class="sticker">英語ラベル</div>
        <div class="donut">
          <svg viewBox="0 0 200 200">
            <circle class="track" cx="100" cy="100" r="84"/>
            <!-- dasharray第1値 = 528 × 割合(0〜1)。例: 84% → 443 -->
            <circle class="arc" cx="100" cy="100" r="84" stroke-dasharray="443 528"/>
          </svg>
          <div class="in">
            <!-- 🚫 数値がリングに触れたら失敗。「8.4」など3字まではデフォルトでOK、
                 「83.6」など4字以上＋単位は style="font-size:68px;" で縮小する -->
            <div class="n">8.4<small>倍</small></div>
            <div class="l">指標名（6字以内）</div>
          </div>
        </div>
        <div class="hero-copy">
          <div class="big-label">指標の正式名<br>（前 → 後）</div>
          <div class="delta">
            <span class="from">120人</span><span class="arrow">→</span>
            <span class="to">1,010<small>人</small></span>
          </div>
          <div class="delta-l">補足1行（30字以内）</div>
        </div>
      </div>
      <div class="sub-stats">
        <div class="chip"><div class="ico">⏱</div>
          <div><div class="v">15<small>分</small></div><div class="k">脇役指標名</div></div></div>
        <div class="chip"><div class="ico">🔥</div>
          <div><div class="v">92<small>%</small></div><div class="k">脇役指標名</div></div></div>
      </div>
    </div>
  </div>
  ...brand/pageno...
</div>
```

## 14. timeline — ロードマップ（3〜5ノード）

```html
<div class="slide">
  <div class="deco layer-texture"></div>
  <div class="head">...</div>
  <div class="timeline">
    <div class="tl-nodes" style="--cols: 4;">
      <div class="tl-node is-now">  <!-- is-now は現在地1つだけ（任意） -->
        <div class="when">DAY 0-14</div><div class="dot"></div>
        <h3>節目名（8字以内）</h3>
        <p>説明。35字以内。</p>
      </div>
      <!-- --cols と同数 -->
    </div>
  </div>
  ...brand/pageno...
</div>
```

## 15. funnel — 絞り込み・ファネル（3〜4段）

「たくさん→絞る」の物語に。上から段数分だけ .fu-row を置く（幅・色は自動で細くなる）。

```html
<div class="slide">
  <div class="deco layer-texture"></div>
  <div class="head">...</div>
  <div class="funnel">
    <div class="fu-row"><div class="fu-bar"><span class="t">段の名前</span><span class="v">142</span></div></div>
    <div class="fu-row"><div class="fu-bar"><span class="t">段の名前</span><span class="v">38</span></div></div>
    <div class="fu-row"><div class="fu-bar"><span class="t">段の名前</span><span class="v">6</span></div></div>
  </div>
  ...brand/pageno...
</div>
```

## 16. matrix — 2×2マトリクス（優先度マップ・ポジショニング）

```html
<div class="slide">
  <div class="deco layer-texture"></div>
  <div class="head">...（lead なし推奨・見出しだけ）</div>
  <div class="matrix">
    <div class="mx-axis top">縦軸 上（6字以内）</div>
    <div class="mx-axis bottom">縦軸 下</div>
    <div class="mx-axis left">横軸 左</div>
    <div class="mx-axis right">横軸 右</div>
    <div class="mx-grid">
      <div class="mx-cell"><h3>象限名</h3><p>説明。26字以内。</p></div>
      <div class="mx-cell is-hero"><h3>★ 推し象限</h3><p>説明。</p></div>  <!-- is-hero は1つだけ -->
      <div class="mx-cell"><h3>象限名</h3><p>説明。</p></div>
      <div class="mx-cell"><h3>象限名</h3><p>説明。</p></div>
    </div>
  </div>
  ...brand/pageno...
</div>
```

## 17. bars — 横棒比較（2〜5本）

競合比較・ビフォーアフターの割合に。主役の行にだけ `is-hero`。

```html
<div class="slide">
  <div class="deco layer-texture"></div>
  <div class="deco ghost" style="right:-20px; bottom:-70px;">92%</div>
  <div class="head">...</div>
  <div class="bars">
    <div class="bar-row">
      <div class="k">項目名（12字以内）</div>
      <div class="track"><div class="fill" style="--w: 34%;"></div></div>
      <div class="v">34%</div>
    </div>
    <div class="bar-row is-hero">
      <div class="k">主役の項目</div>
      <div class="track"><div class="fill" style="--w: 92%;"></div></div>
      <div class="v">92%</div>
    </div>
  </div>
  ...brand/pageno...
</div>
```

---

# ★★ Phase 3 — 写真・立体・斜め文字

## 立体感ユーティリティ（どの要素にも足せる）

```html
<div class="card depth-2 tilt-l">…</div>   <!-- 多層シャドウ + 左傾き -->
```
- `.depth-1` / `.depth-2` — 浮遊感のある多層シャドウ（2が強い）
- `.tilt-l` / `.tilt-r` — わずかな傾き（-2deg / +1.6deg）
- `.polaroid` — 写真をポラロイド風に（`<div class="polaroid tilt-r depth-2"><img …><div class="cap">キャプション</div></div>`）
- 使いすぎ注意: 傾き要素は1枚に2個まで

## 18. photo-hero — 全面写真の表紙（斜め帯タイトル）

AI生成写真（scripts/genimg.mjs）または手持ち写真を全面に。写真がまだ無ければ placeholder で成立。

### 🚫 写真×文字の構図ルール（違反したら作り直し）
1. **写真の主役とテキストを重ねない**。テキストは左に置かれるので、生成プロンプトに必ず
   「**被写体は画面の右端3分の1に寄せる。左3分の2は無地で暗めの余白（テキスト用）**」を含める
2. 生成後は**必ずレンダリングして目視**し、被写体とタイトル・サブコピーの衝突を確認。
   被っていたら構図指定を強めて再生成する（--free なら0円で何度でも）
3. 明るい背景に白文字を直置きしない。スクリムで足りなければ帯（.band）に文字を入れる
4. **「3秒で何の写真かわかる」記号を必ず入れる**。主題を象徴する要素をプロンプトに明示する
   （例: コーヒー→黒い液面・湯気・豆 / 料理→湯気と器 / 建築→外観全体）。
   「雰囲気だけ合っていて主題が不明」な写真は不採用にして再生成
5. **--free（無料モデル）には英語でプロンプトを書く**。日本語だと精度が大きく落ちる
   （Gemini本命ルートは日本語でOK）。構図・被写体・ネガティブスペースも英語で指定する

```html
<div class="slide l-photo">
  <div class="photo-bg placeholder"></div>
  <!-- 写真があるとき: <div class="photo-bg"><img src="assets/cover.png"></div> -->
  <div class="photo-scrim"></div>
  <div class="photo-body">
    <div class="photo-eyebrow">英語アイキャッチ ── 年など</div>
    <div class="band-title">
      <span class="band dark">タイトル1行目（12字以内）</span>
      <span class="band">2行目（アクセント色の帯）</span>
      <!-- .band.alt = 白帯。帯は2〜3本まで -->
    </div>
    <p class="photo-sub">サブコピー。2行以内。</p>
  </div>
  ...brand/pageno...
</div>
```

## 19. breakout — 円から飛び出すビジュアル

写真（背景透過PNG推奨）・絵文字・スポットイラストが円形フレームを突き破る立体レイアウト。

```html
<div class="slide">
  <div class="deco layer-texture"></div>
  <div class="deco ghost" style="left:-20px; bottom:-70px;">GO!</div>
  <div class="breakout-grid">
    <div class="story">…（hero-statと同じ story ブロック）…</div>
    <div class="bo-stage">
      <div class="bo-circle"></div>
      <div class="bo-emoji">🚀</div>
      <!-- 写真なら: <img class="bo-img" src="assets/person.png">（透過PNG・縦長） -->
      <div class="chip bo-float depth-2 tilt-l" style="right:-10px; top:90px; width:300px;">
        <div class="ico">📈</div>
        <div><div class="v">8.4<small>倍</small></div><div class="k">指標名</div></div>
      </div>
      <div class="chip bo-float depth-2 tilt-r" style="left:-34px; bottom:60px; width:300px;">…</div>
    </div>
  </div>
  ...brand/pageno...
</div>
```

## ★ tone-dark — 暗面バリアント（明暗リズムの道具）

quote / kinetic / stats は、ルートを `<div class="slide on-cover tone-dark">` にすると
**カバー配色の暗面**になる。白面カード系が続いたら中盤に挟んで、デッキのリズムを作る。

```html
<!-- 暗面 quote -->
<div class="slide on-cover tone-dark">
  <div class="deco layer-texture"></div>
  <div class="quote-wrap">…（quote と同じ構造）…</div>
  ...brand/pageno...
</div>

<!-- 暗面 kinetic -->
<div class="slide on-cover tone-dark">
  <div class="deco layer-texture"></div>
  <div class="kinetic">…（kinetic と同じ構造）…</div>
  ...brand/pageno...
</div>
```
- `on-cover` を必ずセットで付ける（brand / pageno / テクスチャ / ghost が暗面色に切り替わる）
- 使用箇所の目安: 10枚超のデッキで1〜2枚。表紙・章扉・締めの暗面と合わせて「明→暗→明」を設計する

## 20. kinetic — 斜め文字ステートメント（雑誌風）

一番強いメッセージを1枚使って叫ぶ。デッキ中盤の「間」や章の締めに。

```html
<div class="slide">
  <div class="deco layer-texture"></div>
  <div class="kinetic">
    <div class="k-stack">
      <div class="k-tag">英語タグ</div>
      <div class="k-line k-outline" style="font-size:120px;">アウトラインの行、</div>
      <div class="k-line k-fill" style="font-size:108px; margin-left:70px;">塗り帯の行。</div>
      <div class="k-line k-accent" style="font-size:88px; margin-left:170px;">アクセント帯の行。</div>
    </div>
    <div class="k-foot">── 補足の一文（任意）</div>  <!-- 必ず .kinetic の中に置く（文字群と一塊にする） -->
  </div>
  ...brand/pageno...
</div>
```
- 行は3〜4本。font-size と margin-left を階段状にずらす（ジャンプ率）
- k-outline / k-fill / k-accent / 無印(k-line) を混ぜる。同種を連続させない
- **空間を埋める**: 3行なら font-size 130 / 116 / 94px 程度を目安に大きく使う（小さいと空白が余って弱い）。
  空いた象限に ghost（1文字）を置くとさらに締まる

## 写真・イラストの入手方法

1. **AI生成写真**: `node scripts/genimg.mjs "プロンプト" decks/<案件>/assets/xxx.png --style <テーマ名>`（初回は `node scripts/setup-gemini.mjs` でキー設定）
2. **イラスト**: `core/illustrations.md` の線画アイコン24種＋スポットイラスト6種（コピペで使える・無料）
3. **ユーザー提供写真**: `decks/<案件>/assets/` に置いて `<img>` 参照

---

## 台本→レイアウト対応の目安

| 台本の内容 | 使うレイアウト |
|-----------|--------------|
| タイトル・冒頭 | cover |
| 目次・流れ | agenda |
| 章の切り替わり | section |
| 「3つの理由」「ポイントは◯つ」 | cards（横並び） / list（説明が長い時は縦） |
| 「◯◯ vs ◯◯」「やりがちな失敗と正解」 | compare |
| 「手順」「流れ」「ステップ」 | steps |
| 一番伝えたい数字が1つ | **hero-stat（最優先）** |
| 実績・数字・料金 | stats / table / bars |
| スケジュール・ロードマップ | timeline |
| 絞り込み・選抜の物語 | funnel |
| 優先度・ポジショニング | matrix |
| 名言・お客様の声・一番伝えたい一文 | quote |
| 画像を見せたい・機能紹介 | media |
| まとめ・行動喚起 | closing |

デッキ全体の鉄則: **cover で始まり closing で終わる**。5枚を超えるなら agenda を2枚目に。同じレイアウトを3連続以上使わない（単調になる）。

## プロ級の鉄則（Phase 2 — 「シンプル止まり」を防ぐ）

1. **図解優先**: 数字・変化・対比が台本にあれば、文章カードでなく hero-stat / bars / funnel / timeline / matrix に必ず翻訳する
2. **1デッキに最低1枚**はリッチレイアウト（13〜17）を入れる
3. **レイヤーを効かせる**: layer-texture はほぼ全枚、ghost は主役数字のある枚に。annot は1デッキ1〜2回まで
4. **ジャンプ率**: 1枚の主役は1つ。主役を巨大に、脇役は明確に小さく
5. **強調語 `<em>`**: 見出しに1〜2箇所。afterの見本は `_labs/pro-demo/`
6. **明暗リズム**: 白面カード系レイアウトを4枚以上連続させない。10枚超のデッキは
   中盤に暗面（tone-dark の quote / kinetic、または section）を1〜2枚挟む
7. **余白を放置しない**: コンテンツゾーンの下1/3が空くスライドは失敗。
   文章を足す・行を増やす・レイアウトを変える・2枚を1枚に統合する、のいずれかで埋める
