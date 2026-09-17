/* 線画アイコン — core/illustrations.md のカタログをそのまま読み込んで使う（二重管理しない） */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const md = readFileSync(fileURLToPath(new URL('../core/illustrations.md', import.meta.url)), 'utf8');
export const ICONS = {};
for (const m of md.matchAll(/<!-- icon: ([a-z-]+)[^\n]*-->\s*<svg[^>]*>([\s\S]*?)<\/svg>/g)) ICONS[m[1]] = m[2].trim();

/* カタログに無い業務系アイコンを追加（同じ線画仕様: viewBox 200・線幅は描画側で指定） */
Object.assign(ICONS, {
  document: '<path d="M56 24 H118 L150 56 V176 H56 Z"/><path d="M118 24 V56 H150"/><path d="M78 96 H128"/><path d="M78 124 H128"/><path d="M78 152 H108"/>',
  check: '<path d="M40 104 L82 146 L162 58"/>',
  lock: '<rect x="46" y="90" width="108" height="86" rx="14"/><path d="M70 90 V64 C70 44 84 30 100 30 C116 30 130 44 130 64 V90"/><path d="M100 124 V144"/>',
  calendar: '<rect x="30" y="44" width="140" height="130" rx="14"/><path d="M30 84 H170"/><path d="M66 26 V58"/><path d="M134 26 V58"/><path d="M62 116 H80"/><path d="M92 116 H110"/><path d="M122 116 H140"/><path d="M62 144 H80"/>',
  flag: '<path d="M50 176 V28"/><path d="M50 36 H150 L128 72 L150 108 H50"/>',
  search: '<circle cx="86" cy="86" r="52"/><path d="M124 124 L170 170"/>',
  alert: '<path d="M100 28 L178 166 H22 Z"/><path d="M100 80 V118"/><path d="M100 142 V144"/>',
  yen: '<path d="M52 30 L100 102 L148 30"/><path d="M100 102 V174"/><path d="M62 112 H138"/><path d="M62 142 H138"/>',
  calculator: '<rect x="44" y="24" width="112" height="152" rx="14"/><rect x="64" y="44" width="72" height="30" rx="4"/><path d="M68 102 H76"/><path d="M96 102 H104"/><path d="M124 102 H132"/><path d="M68 130 H76"/><path d="M96 130 H104"/><path d="M124 130 H132"/><path d="M68 156 H104"/>',
  upload: '<path d="M100 132 V32"/><path d="M60 72 L100 32 L140 72"/><path d="M36 128 V168 H164 V128"/>',
  robot: '<rect x="42" y="64" width="116" height="92" rx="18"/><path d="M100 64 V36"/><circle cx="100" cy="30" r="8"/><circle cx="76" cy="106" r="10"/><circle cx="124" cy="106" r="10"/><path d="M80 136 H120"/><path d="M42 104 H26"/><path d="M158 104 H174"/>',
  arrow: '<path d="M30 100 H164"/><path d="M122 58 L164 100 L122 142"/>',
});

export const ICON_NAMES = Object.keys(ICONS);

export function icon(name, size = 48) {
  const inner = ICONS[name];
  if (!inner) return '';
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
