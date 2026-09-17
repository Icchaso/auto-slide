# SlideSmith イラストカタログ — 線画アイコン24種 + スポットイラスト6種

スライドに「わかりやすい絵」を足すためのインラインSVG部品集。
**コピペでそのまま使える**。色は親要素の CSS `color` を継承する（`stroke="currentColor"`）ので、
テーマ色が自動で乗る。画像ファイル不要・QC対象外（SVGはテキストノードを持たないため）。

---

## パート1: 線画アイコン（24種）

### 統一仕様

- `viewBox="0 0 200 200"` / `fill="none" stroke="currentColor"`
- `stroke-width="10" stroke-linecap="round" stroke-linejoin="round"`（丸みのある親しみやすい線）
- 表示サイズは `width` 属性で指定（正方形なので `height` は省略可）

### 使い方 3パターン

**A. カードの badge に入れる**（数字の代わりにアイコン）。badge は 64px 角なので `width="36"` が最適。
色指定は不要 — badge の `color`（pop テーマなら白 / 3枚目は ink）を自動継承する。

```html
<div class="card">
  <div class="badge icon">
    <svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
      <!-- ↓ 下のカタログから中身をコピー -->
      <path d="..."/>
    </svg>
  </div>
  <h3>カード見出し</h3>
  <p>本文。</p>
</div>
```

- vlist の badge（82px角）なら `width="46"`、steps の badge（84px円）なら `width="44"`

**B. hero-stat のチップ（.ico）に入れる**（絵文字の代わり）。.ico は 62px 角なので `width="34"`。

```html
<div class="chip">
  <div class="ico">
    <svg viewBox="0 0 200 200" width="34" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="100" cy="100" r="72"/><path d="M100 58 V100 L130 116"/>
    </svg>
  </div>
  <div><div class="v">15<small>分</small></div><div class="k">平均対応時間</div></div>
</div>
```

**C. 大きく飾りとして使う**（media-box の中・余白のアクセント）。`width` を 120〜200 に上げ、
`style="color: var(--accent)"` などでテーマ色を明示する。細く見える場合は `stroke-width` を 8 に落とすと上品。

```html
<div class="media-box">
  <svg viewBox="0 0 200 200" width="200" style="color: var(--accent)" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
    <path d="..."/>
  </svg>
</div>
```

---

### カタログ（ビジネス / 成長 / 生活 / 感情）

```html
<!-- icon: rocket ロケット（スタート・立ち上げ・加速） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M100 20 C74 42 64 80 64 118 L136 118 C136 80 126 42 100 20 Z"/>
  <circle cx="100" cy="78" r="17"/>
  <path d="M64 112 L40 148 L66 140"/>
  <path d="M136 112 L160 148 L134 140"/>
  <path d="M86 138 L82 158"/><path d="M114 138 L118 158"/><path d="M100 142 L100 172"/>
</svg>
```

```html
<!-- icon: chart-up 折れ線グラフ上昇（成長・改善・右肩上がり） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M34 32 V166 H168"/>
  <path d="M52 136 L86 100 L112 122 L156 66"/>
  <path d="M132 62 H158 V88"/>
</svg>
```

```html
<!-- icon: bar-chart 棒グラフ（実績・比較・データ） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M32 168 H168"/>
  <rect x="46" y="108" width="28" height="60" rx="6"/>
  <rect x="86" y="76" width="28" height="92" rx="6"/>
  <rect x="126" y="44" width="28" height="124" rx="6"/>
</svg>
```

```html
<!-- icon: clock 時計（時間・効率・スピード） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="100" cy="100" r="72"/>
  <path d="M100 58 V100 L130 116"/>
</svg>
```

```html
<!-- icon: bulb 電球（アイデア・ひらめき・コツ） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M100 26 C74 26 54 46 54 71 C54 88 63 101 74 109 C79 113 82 118 82 124 V130 H118 V124 C118 118 121 113 126 109 C137 101 146 88 146 71 C146 46 126 26 100 26 Z"/>
  <path d="M84 150 H116"/><path d="M90 168 H110"/>
</svg>
```

```html
<!-- icon: target ターゲット（目標・的中・狙い） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="88" cy="112" r="60"/>
  <circle cx="88" cy="112" r="34"/>
  <circle cx="88" cy="112" r="8"/>
  <path d="M88 112 L164 36"/><path d="M164 36 V62"/><path d="M164 36 H138"/>
</svg>
```

```html
<!-- icon: gear 歯車（仕組み・設定・自動化） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="100" cy="100" r="52"/>
  <circle cx="100" cy="100" r="22"/>
  <path d="M100 48 V26"/><path d="M137 63 L152 48"/><path d="M152 100 H174"/><path d="M137 137 L152 152"/>
  <path d="M100 152 V174"/><path d="M63 137 L48 152"/><path d="M48 100 H26"/><path d="M63 63 L48 48"/>
</svg>
```

```html
<!-- icon: mail メール（連絡・お知らせ・DM） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <rect x="28" y="48" width="144" height="104" rx="16"/>
  <path d="M36 62 L100 114 L164 62"/>
</svg>
```

```html
<!-- icon: smartphone スマホ（モバイル・SNS・アプリ） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <rect x="60" y="22" width="80" height="156" rx="18"/>
  <path d="M88 44 H112"/><path d="M94 154 H106"/>
</svg>
```

```html
<!-- icon: laptop PC（仕事・オンライン・ツール） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <rect x="44" y="42" width="112" height="78" rx="10"/>
  <path d="M44 120 L32 156 H168 L156 120"/>
  <path d="M84 138 H116"/>
</svg>
```

```html
<!-- icon: book 本（学び・知識・マニュアル） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M100 58 C82 44 56 40 32 46 V148 C56 142 82 146 100 160 C118 146 144 142 168 148 V46 C144 40 118 44 100 58 Z"/>
  <path d="M100 58 V160"/>
</svg>
```

```html
<!-- icon: key 鍵（秘訣・アクセス・解決のカギ） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="58" cy="100" r="30"/>
  <path d="M88 100 H172"/>
  <path d="M142 100 V128"/><path d="M168 100 V128"/>
</svg>
```

```html
<!-- icon: shield 盾（安心・保証・セキュリティ） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M100 24 L162 46 V104 C162 142 136 166 100 178 C64 166 38 142 38 104 V46 Z"/>
  <path d="M72 100 L94 122 L132 78"/>
</svg>
```

```html
<!-- icon: heart ハート（好き・ファン・共感） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M100 168 C70 144 32 116 32 78 C32 52 52 34 76 34 C86 34 95 40 100 52 C105 40 114 34 124 34 C148 34 168 52 168 78 C168 116 130 144 100 168 Z"/>
</svg>
```

```html
<!-- icon: star 星（おすすめ・評価・お気に入り） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M100 32 L118 80 L169 82 L129 114 L143 164 L100 136 L57 164 L71 114 L31 82 L82 80 Z"/>
</svg>
```

```html
<!-- icon: speech 吹き出し（声・口コミ・対話） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M48 38 H152 C165 38 174 47 174 60 V112 C174 125 165 134 152 134 H98 L66 164 V134 H48 C35 134 26 125 26 112 V60 C26 47 35 38 48 38 Z"/>
  <circle cx="70" cy="86" r="3"/><circle cx="100" cy="86" r="3"/><circle cx="130" cy="86" r="3"/>
</svg>
```

```html
<!-- icon: person 人（お客さま・個人・ユーザー） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="100" cy="64" r="32"/>
  <path d="M42 172 C42 132 68 112 100 112 C132 112 158 132 158 172"/>
</svg>
```

```html
<!-- icon: people 人々・3人（チーム・コミュニティ・みんな） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="44" cy="88" r="18"/>
  <path d="M14 162 C14 136 26 120 44 120 C52 120 58 123 63 128"/>
  <circle cx="156" cy="88" r="18"/>
  <path d="M186 162 C186 136 174 120 156 120 C148 120 142 123 137 128"/>
  <circle cx="100" cy="66" r="26"/>
  <path d="M64 162 C64 128 80 110 100 110 C120 110 136 128 136 162"/>
</svg>
```

```html
<!-- icon: house 家（暮らし・店舗・ホーム） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M36 96 L100 38 L164 96"/>
  <path d="M52 92 V168 H148 V92"/>
  <path d="M86 168 V132 C86 124 92 120 100 120 C108 120 114 124 114 132 V168"/>
</svg>
```

```html
<!-- icon: coffee コーヒーカップ（休憩・気軽さ・カフェ） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M42 78 H142 V116 C142 148 120 166 92 166 C64 166 42 148 42 116 Z"/>
  <path d="M142 88 H150 C168 88 176 100 172 114 C168 128 156 134 142 132"/>
  <path d="M72 30 C66 40 78 48 72 58"/><path d="M108 30 C102 40 114 48 108 58"/>
</svg>
```

```html
<!-- icon: sprout 芽・植物（育成・はじまり・成長の種） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M100 170 V96"/>
  <path d="M100 108 C64 108 44 88 40 56 C74 58 98 76 100 108 Z"/>
  <path d="M100 92 C132 92 152 74 158 42 C126 44 102 62 100 92 Z"/>
  <path d="M58 172 H142"/>
</svg>
```

```html
<!-- icon: music 音符（楽しさ・BGM・リズム） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M76 148 V52 L152 38 V134"/>
  <ellipse cx="60" cy="148" rx="17" ry="13"/>
  <ellipse cx="136" cy="134" rx="17" ry="13"/>
</svg>
```

```html
<!-- icon: camera カメラ（写真・記録・映える） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M70 62 L80 42 H120 L130 62"/>
  <rect x="28" y="62" width="144" height="100" rx="18"/>
  <circle cx="100" cy="112" r="30"/>
  <path d="M146 84 H154"/>
</svg>
```

```html
<!-- icon: trophy トロフィー（達成・No.1・表彰） -->
<svg viewBox="0 0 200 200" width="36" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path d="M62 36 H138 V78 C138 106 121 124 100 124 C79 124 62 106 62 78 Z"/>
  <path d="M62 48 H44 C32 48 28 60 32 72 C37 86 50 92 64 90"/>
  <path d="M138 48 H156 C168 48 172 60 168 72 C163 86 150 92 136 90"/>
  <path d="M100 124 V146"/><path d="M80 146 H120"/><path d="M68 170 H132"/>
</svg>
```

---

## パート2: スポットイラスト（6種）

アイコンより大きい「場面の絵」。有機的な blob（ゆるい円）背景 + 線画の組み合わせで、
1個のSVGとして完結する（`viewBox="0 0 400 300"`）。

### 仕様

- blob は `fill="var(--accent-3, #FFC93C)" opacity="0.35"` — テーマ変数で塗られ、テーマがなければ黄色にフォールバック
- 線画は `stroke="currentColor" stroke-width="8"`（大きいぶん少し細めが上品）
- 色を変えたいときはルートに `style="color: var(--ink)"` など

### 使い方: media-box の placeholder の代わりに

画像がまだ無い media スライドで `<div class="placeholder">IMAGE</div>` の代わりに置くと、
「準備中」感が消えて完成品に見える。media-box は最大 520px 高なので `width="640"`（4:3 → 高さ480）が最適。

```html
<div class="media-grid">
  <div class="media-copy">
    <h3>小見出し</h3>
    <p>本文段落</p>
  </div>
  <div class="media-box">
    <!-- placeholder の代わりにスポットイラストを丸ごと貼る -->
    <svg viewBox="0 0 400 300" width="640" fill="none" stroke-linecap="round" stroke-linejoin="round">
      ...下のカタログから中身をコピー...
    </svg>
  </div>
</div>
```

そのほか、section（章扉）の余白や closing の脇に `width="480"` 程度で置いても効く
（レイアウトの主役文字に重ねる場合は `<div class="deco">` で包んで absolute 配置する）。

---

```html
<!-- spot: growth 成長（丘を登る矢印と旗） -->
<svg viewBox="0 0 400 300" width="640" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path fill="var(--accent-3, #FFC93C)" opacity="0.35" stroke="none"
        d="M205 22 C300 14 372 78 366 158 C360 238 288 282 196 274 C104 266 34 224 40 146 C46 68 110 30 205 22 Z"/>
  <g stroke="currentColor" stroke-width="8">
    <path d="M28 262 H372"/>
    <path d="M28 262 C150 254 260 200 330 96"/>
    <path d="M56 216 C140 200 208 160 256 98"/>
    <path d="M274 78 L244 88 L266 112 Z"/>
    <path d="M330 96 V26"/>
    <path d="M330 30 L372 42 L330 54 Z"/>
  </g>
</svg>
```

```html
<!-- spot: idea アイデア（大きな電球と星の煌めき） -->
<svg viewBox="0 0 400 300" width="640" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path fill="var(--accent-3, #FFC93C)" opacity="0.35" stroke="none"
        d="M198 18 C296 12 366 72 362 152 C358 232 290 280 196 276 C102 272 36 226 40 142 C44 58 100 24 198 18 Z"/>
  <g stroke="currentColor" stroke-width="8">
    <path d="M200 44 C154 44 120 78 120 122 C120 152 136 174 155 188 C163 194 168 202 168 212 V222 H232 V212 C232 202 237 194 245 188 C264 174 280 152 280 122 C280 78 246 44 200 44 Z"/>
    <path d="M186 158 L200 134 L214 158"/>
    <path d="M176 244 H224"/><path d="M184 264 H216"/>
    <path d="M330 40 V80"/><path d="M310 60 H350"/>
    <path d="M70 56 V84"/><path d="M56 70 H84"/>
    <path d="M60 162 L66 176 L80 182 L66 188 L60 202 L54 188 L40 182 L54 176 Z"/>
    <circle cx="322" cy="188" r="5"/>
  </g>
</svg>
```

```html
<!-- spot: dialogue 対話（2つの吹き出しと人2人の上半身） -->
<svg viewBox="0 0 400 300" width="640" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path fill="var(--accent-3, #FFC93C)" opacity="0.35" stroke="none"
        d="M200 30 C298 22 368 84 362 160 C356 236 286 284 194 278 C102 272 34 228 40 150 C46 72 102 38 200 30 Z"/>
  <g stroke="currentColor" stroke-width="8">
    <circle cx="110" cy="176" r="30"/>
    <path d="M58 266 C58 226 80 208 110 208 C140 208 162 226 162 266"/>
    <circle cx="290" cy="176" r="30"/>
    <path d="M238 266 C238 226 260 208 290 208 C320 208 342 226 342 266"/>
    <path d="M70 34 H190 C202 34 210 42 210 54 V96 C210 108 202 116 190 116 H130 L112 142 V116 H70 C58 116 50 108 50 96 V54 C50 42 58 34 70 34 Z"/>
    <circle cx="105" cy="75" r="3"/><circle cx="130" cy="75" r="3"/><circle cx="155" cy="75" r="3"/>
    <path d="M240 62 H340 C352 62 360 70 360 82 V112 C360 124 352 132 340 132 H300 L284 156 V132 H240 C228 132 220 124 220 112 V82 C220 70 228 62 240 62 Z"/>
    <path d="M252 88 H328"/><path d="M252 106 H304"/>
  </g>
</svg>
```

```html
<!-- spot: achievement 達成（トロフィーと紙吹雪） -->
<svg viewBox="0 0 400 300" width="640" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path fill="var(--accent-3, #FFC93C)" opacity="0.35" stroke="none"
        d="M202 26 C298 18 366 78 362 156 C358 234 288 280 196 274 C104 268 36 224 42 146 C48 68 106 34 202 26 Z"/>
  <g stroke="currentColor" stroke-width="8">
    <path d="M140 70 H260 V128 C260 168 234 194 200 194 C166 194 140 168 140 128 Z"/>
    <path d="M140 86 H112 C96 86 90 102 96 118 C102 136 120 144 142 140"/>
    <path d="M260 86 H288 C304 86 310 102 304 118 C298 136 280 144 258 140"/>
    <path d="M200 194 V222"/><path d="M172 222 H228"/><path d="M156 252 H244"/>
    <circle cx="80" cy="60" r="5"/><circle cx="330" cy="90" r="5"/><circle cx="60" cy="170" r="5"/>
    <path d="M120 30 L136 36 L124 48 Z"/>
    <path d="M40 110 C48 102 56 118 64 110"/>
    <path d="M340 40 C348 32 356 48 364 40"/>
    <path d="M320 180 L336 186 L324 198 Z"/>
  </g>
</svg>
```

```html
<!-- spot: stacking 積み上げ（本の山と芽） -->
<svg viewBox="0 0 400 300" width="640" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path fill="var(--accent-3, #FFC93C)" opacity="0.35" stroke="none"
        d="M196 24 C294 16 364 76 360 154 C356 232 288 280 196 276 C104 272 36 226 42 148 C48 70 98 32 196 24 Z"/>
  <g stroke="currentColor" stroke-width="8">
    <rect x="110" y="210" width="180" height="44" rx="10"/>
    <rect x="126" y="166" width="160" height="44" rx="10"/>
    <rect x="118" y="122" width="150" height="44" rx="10"/>
    <path d="M198 118 V70"/>
    <path d="M198 92 C176 92 164 80 162 60 C182 62 196 72 198 92 Z"/>
    <path d="M198 80 C218 80 230 68 233 48 C214 50 200 60 198 80 Z"/>
    <path d="M84 258 H316"/>
  </g>
</svg>
```

```html
<!-- spot: time 時間（大きな時計とコーヒー） -->
<svg viewBox="0 0 400 300" width="640" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path fill="var(--accent-3, #FFC93C)" opacity="0.35" stroke="none"
        d="M204 20 C300 14 370 76 364 156 C358 236 288 282 194 276 C100 270 34 224 40 144 C46 64 108 26 204 20 Z"/>
  <g stroke="currentColor" stroke-width="8">
    <circle cx="160" cy="140" r="95"/>
    <path d="M160 55 V71"/><path d="M245 140 H229"/><path d="M160 225 V209"/><path d="M75 140 H91"/>
    <path d="M160 140 V86"/><path d="M160 140 L198 158"/>
    <path d="M280 180 H364 V208 C364 236 345 252 322 252 C299 252 280 236 280 208 Z"/>
    <path d="M364 188 H370 C384 188 390 198 387 209 C384 220 374 226 364 224"/>
    <path d="M306 138 C300 148 312 156 306 166"/>
    <path d="M338 138 C332 148 344 156 338 166"/>
  </g>
</svg>
```

---

## 選び方の目安

| 台本の内容 | 使う部品 |
|-----------|---------|
| カードの要点に絵を添えたい | 線画アイコン（badge に width 36） |
| hero-stat の脇役指標 | 線画アイコン（chip .ico に width 34） |
| media の画像がまだ無い | スポットイラスト（placeholder の代わり） |
| 章扉・締めに雰囲気を足したい | スポットイラスト width 480 / 大アイコン width 160 |

鉄則: **1枚のスライドに使うアイコンのテイストを混ぜない**（このカタログ内なら統一済みなので安全）。
絵文字とこのカタログの線画を同じ列に並べるのは避ける（質感がぶつかる）。
