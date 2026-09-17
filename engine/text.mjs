/* 文字まわりの共通処理（エスケープ・強調記法・文字幅・見出しの文末判定） */

export const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* *強調* → <em>強調</em>、改行 \n → <br> */
export const rich = s => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');

/* 表示上の文字数（全角=1、半角=0.5）。強調記号 * は数えない */
export const width = s => [...String(s ?? '').replace(/\*/g, '')]
  .reduce((n, ch) => n + (/[ -~｡-ﾟ]/.test(ch) ? 0.5 : 1), 0);

export const plain = s => String(s ?? '').replace(/\*/g, '').replace(/\n/g, '');

/* 見出しが文の途中で終わっていないか（qc.mjs と同じ判定を事前に行う） */
export function titleProblem(raw) {
  const t = plain(raw).replace(/\s+/g, '');
  if (!t) return null;
  if (/[。！？!?」』）)]$/.test(t)) return null;
  if (/(、|の|を|が|(?<![こごひもあ])と|や|へ|より|から|ため|ので|けど|けれど|…|\.\.\.|：|:)$/.test(t))
    return `文の途中で終わっている（「${t.slice(-6)}」）。述語まで書くか、言い切りなら「。」を付ける`;
  if (/[をがにはと][一-龥ぁ-んァ-ン]$/.test(t) && t.length > 8)
    return `最後の1文字で切れている疑い（「${t.slice(-6)}」）。述語まで書く`;
  return null;
}
