// Product illustrations drawn as SVG.
// Each product has { type, palette }; variants swap the palette, so choosing
// "Cobalt" or "Olive" recolours the picture instantly with no image files.

export const PALETTES = {
  terracotta: { bg: '#efe2d2', body: '#c4643a', accent: '#f2dcc0', dark: '#3a2217' },
  cobalt: { bg: '#e3e7ef', body: '#2f5394', accent: '#eef2f9', dark: '#14213f' },
  olive: { bg: '#e8eadb', body: '#6c7a39', accent: '#f1efd6', dark: '#2a2f17' },
  sand: { bg: '#efe8da', body: '#cdb48a', accent: '#fbf5e8', dark: '#53432c' },
  wool: { bg: '#e9e0d3', body: '#f5eee3', accent: '#9b3a2c', dark: '#2d2522' },
  madder: { bg: '#efe1d9', body: '#9b3a2c', accent: '#f0d9b8', dark: '#2d1712' },
  indigo: { bg: '#e1e3ec', body: '#2f3d6b', accent: '#e8d8b0', dark: '#151b31' },
  saffron: { bg: '#f3e7cf', body: '#e0a53a', accent: '#fff6e0', dark: '#4a3410' },
  sage: { bg: '#e5eae1', body: '#8fa58a', accent: '#f4f6ef', dark: '#2f3a2d' },
  copper: { bg: '#efe0d3', body: '#b8673a', accent: '#f0b483', dark: '#4a2213' },
  brass: { bg: '#efe8d4', body: '#c79a3a', accent: '#f8e2a0', dark: '#47340f' },
  wood: { bg: '#ede4d8', body: '#a9723f', accent: '#d4a06a', dark: '#4a2d15' },
  leather: { bg: '#ede2d7', body: '#8b4a28', accent: '#c88a58', dark: '#371c0e' },
  soap: { bg: '#e9ecdc', body: '#c3c98f', accent: '#f4f6e4', dark: '#56603a' },
  wax: { bg: '#f2ead6', body: '#e6c26a', accent: '#fff2c4', dark: '#6a511c' },
};

let uid = 0;

/* Pattern helpers */
function zigzag(x1, x2, y, h, n) {
  const w = (x2 - x1) / n;
  let d = `M${x1} ${y + h}`;
  for (let i = 0; i < n; i++) d += ` L${x1 + i * w + w / 2} ${y} L${x1 + (i + 1) * w} ${y + h}`;
  return `${d} Z`;
}
function diamonds(x1, x2, cy, r, n, fill) {
  const w = (x2 - x1) / n;
  let s = '';
  for (let i = 0; i < n; i++) {
    const cx = x1 + w * (i + 0.5);
    s += `<path d="M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z" fill="${fill}"/>`;
  }
  return s;
}
function dots(x1, x2, y, r, n, fill) {
  const w = (x2 - x1) / n;
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${x1 + w * (i + 0.5)}" cy="${y}" r="${r}" fill="${fill}"/>`;
  return s;
}
const shadow = (p, rx = 120, cy = 334) => `<ellipse cx="200" cy="${cy}" rx="${rx}" ry="14" fill="${p.dark}" opacity=".14"/>`;
const shine = (d) => `<path d="${d}" stroke="#fff" stroke-opacity=".22" stroke-width="10" fill="none" stroke-linecap="round"/>`;

/* Illustrations: each returns SVG markup in a 400×400 box. */
const DRAW = {
  vase(p, id) {
    const body = 'M168 80 H232 L228 92 C224 110 222 122 222 132 C222 150 300 175 300 240 C300 290 270 318 250 320 H150 C130 318 100 290 100 240 C100 175 178 150 178 132 C178 122 176 110 172 92 Z';
    return `${shadow(p, 105)}
      <clipPath id="${id}"><path d="${body}"/></clipPath>
      <path d="${body}" fill="${p.body}"/>
      <g clip-path="url(#${id})">
        <rect x="90" y="194" width="220" height="44" fill="${p.accent}"/>
        <path d="${zigzag(90, 310, 204, 26, 11)}" fill="${p.dark}"/>
        <rect x="90" y="194" width="220" height="4" fill="${p.dark}"/>
        <rect x="90" y="234" width="220" height="4" fill="${p.dark}"/>
        ${dots(100, 300, 262, 4.5, 10, p.accent)}
        <rect x="150" y="104" width="100" height="7" fill="${p.accent}"/>
        ${diamonds(170, 230, 150, 6, 4, p.accent)}
        ${shine('M128 206 C126 246 138 282 160 304')}
      </g>
      <ellipse cx="200" cy="81" rx="32" ry="6" fill="${p.dark}" opacity=".55"/>`;
  },
  tajine(p, id) {
    const lid = 'M100 282 C135 268 168 170 190 118 C194 108 206 108 210 118 C232 170 265 268 300 282 Z';
    return `${shadow(p, 140, 330)}
      <path d="M66 282 H334 C330 304 300 320 200 320 C100 320 70 304 66 282 Z" fill="${p.body}"/>
      <path d="M66 282 H334 C330 304 300 320 200 320 C100 320 70 304 66 282 Z" fill="${p.dark}" opacity=".18"/>
      <ellipse cx="200" cy="282" rx="134" ry="12" fill="${p.dark}" opacity=".3"/>
      <clipPath id="${id}"><path d="${lid}"/></clipPath>
      <path d="${lid}" fill="${p.body}"/>
      <g clip-path="url(#${id})">
        <rect x="90" y="226" width="220" height="30" fill="${p.accent}"/>
        <path d="${zigzag(90, 310, 232, 20, 12)}" fill="${p.dark}"/>
        <rect x="90" y="178" width="220" height="6" fill="${p.accent}"/>
        ${dots(150, 250, 200, 3.5, 6, p.accent)}
        ${shine('M178 150 C164 190 150 230 132 266')}
      </g>
      <circle cx="200" cy="110" r="13" fill="${p.body}"/>
      <circle cx="200" cy="104" r="7" fill="${p.accent}"/>`;
  },
  bowl(p, id) {
    const bowl = 'M78 196 H322 C320 264 272 306 200 306 C128 306 80 264 78 196 Z';
    return `${shadow(p, 110, 326)}
      <rect x="156" y="296" width="88" height="20" rx="6" fill="${p.body}"/>
      <rect x="156" y="296" width="88" height="20" rx="6" fill="${p.dark}" opacity=".35"/>
      <clipPath id="${id}"><path d="${bowl}"/></clipPath>
      <path d="${bowl}" fill="${p.body}"/>
      <g clip-path="url(#${id})">
        ${diamonds(96, 304, 244, 10, 9, p.accent)}
        <rect x="70" y="222" width="260" height="3" fill="${p.accent}" opacity=".8"/>
        <rect x="70" y="264" width="260" height="3" fill="${p.accent}" opacity=".8"/>
        ${shine('M104 220 C112 256 132 280 160 294')}
      </g>
      <ellipse cx="200" cy="196" rx="122" ry="26" fill="${p.accent}"/>
      <ellipse cx="200" cy="199" rx="112" ry="20" fill="${p.body}"/>
      <ellipse cx="200" cy="199" rx="112" ry="20" fill="${p.dark}" opacity=".3"/>`;
  },
  plate(p) {
    let ring = '';
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2;
      ring += `<circle cx="${200 + 111 * Math.cos(a)}" cy="${196 + 111 * Math.sin(a)}" r="5" fill="${p.body}"/>`;
    }
    let petals = '';
    for (let k = 0; k < 16; k++) {
      petals += `<ellipse cx="200" cy="128" rx="7" ry="14" fill="${p.body}" opacity=".85" transform="rotate(${k * 22.5} 200 196)"/>`;
    }
    return `<circle cx="207" cy="205" r="142" fill="${p.dark}" opacity=".13"/>
      <circle cx="200" cy="196" r="142" fill="${p.accent}" stroke="${p.body}" stroke-width="7"/>
      <circle cx="200" cy="196" r="124" fill="none" stroke="${p.body}" stroke-width="2"/>
      ${ring}
      <circle cx="200" cy="196" r="96" fill="none" stroke="${p.body}" stroke-width="2"/>
      ${petals}
      <rect x="154" y="150" width="92" height="92" fill="${p.body}"/>
      <rect x="154" y="150" width="92" height="92" fill="${p.body}" transform="rotate(45 200 196)"/>
      <circle cx="200" cy="196" r="26" fill="${p.accent}"/>
      <circle cx="200" cy="196" r="10" fill="${p.body}"/>`;
  },
  rug(p, id) {
    let lattice = '';
    for (let o = -260; o <= 260; o += 46) {
      lattice += `<path d="M${124 + o} 84 L${124 + o + 232} 316 M${276 - o} 84 L${276 - o - 232} 316" stroke="${p.dark}" stroke-width="5" stroke-linecap="round"/>`;
    }
    let fringe = '';
    for (let x = 116; x <= 284; x += 8) fringe += `<path d="M${x} 58 V70 M${x} 330 V342" stroke="${p.body}" stroke-width="3" stroke-linecap="round"/><path d="M${x} 58 V70 M${x} 330 V342" stroke="${p.dark}" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>`;
    return `<rect x="104" y="72" width="200" height="270" rx="4" fill="${p.dark}" opacity=".12" transform="rotate(-7 200 200) translate(8 8)"/>
      <g transform="rotate(-7 200 200)">
        ${fringe}
        <rect x="110" y="70" width="180" height="260" rx="3" fill="${p.body}"/>
        <clipPath id="${id}"><rect x="124" y="84" width="152" height="232"/></clipPath>
        <g clip-path="url(#${id})">${lattice}</g>
        ${diamonds(150, 250, 200, 8, 2, p.accent)}
        <path d="M200 160 L212 172 L200 184 L188 172 Z M200 216 L212 228 L200 240 L188 228 Z" fill="${p.accent}"/>
        <rect x="117" y="77" width="166" height="246" fill="none" stroke="${p.accent}" stroke-width="3" opacity=".7"/>
      </g>`;
  },
  cushion(p, id) {
    const shape = 'M108 108 Q200 86 292 108 Q314 200 292 292 Q200 314 108 292 Q86 200 108 108 Z';
    return `${shadow(p, 120, 322)}
      <clipPath id="${id}"><path d="${shape}"/></clipPath>
      <path d="${shape}" fill="${p.body}"/>
      <g clip-path="url(#${id})">
        <rect x="80" y="140" width="240" height="10" fill="${p.accent}"/>
        <rect x="80" y="250" width="240" height="10" fill="${p.accent}"/>
        <path d="${zigzag(80, 320, 160, 22, 10)}" fill="${p.accent}" opacity=".9"/>
        ${diamonds(96, 304, 205, 14, 7, p.accent)}
        ${diamonds(96, 304, 205, 6, 7, p.dark)}
        <path d="${zigzag(80, 320, 226, 22, 10)}" fill="${p.dark}" opacity=".35" transform="matrix(1 0 0 -1 0 474)"/>
        ${shine('M120 130 C150 118 180 114 210 114')}
      </g>
      ${[[108, 108], [292, 108], [292, 292], [108, 292]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${p.dark}"/>`).join('')}`;
  },
  fouta(p) {
    const stripes = (y, h, color) => `<rect x="80" y="${y}" width="240" height="${h}" fill="${color}"/>`;
    let tassels = '';
    for (let y = 238; y <= 292; y += 7) tassels += `<path d="M320 ${y} h14" stroke="${p.body}" stroke-width="3" stroke-linecap="round"/>`;
    for (let y = 168; y <= 222; y += 7) tassels += `<path d="M300 ${y} h14" stroke="${p.accent}" stroke-width="3" stroke-linecap="round"/>`;
    return `${shadow(p, 130, 314)}
      <rect x="80" y="230" width="240" height="72" rx="10" fill="${p.body}"/>
      ${stripes(244, 4, p.accent)}${stripes(252, 2, p.accent)}${stripes(282, 4, p.accent)}
      <rect x="80" y="230" width="240" height="72" rx="10" fill="none" stroke="${p.dark}" stroke-opacity=".15" stroke-width="2"/>
      <rect x="100" y="160" width="200" height="70" rx="10" fill="${p.accent}"/>
      <rect x="100" y="174" width="200" height="6" fill="${p.body}"/>
      <rect x="100" y="184" width="200" height="2" fill="${p.body}"/>
      <rect x="100" y="210" width="200" height="6" fill="${p.body}"/>
      <rect x="100" y="160" width="200" height="70" rx="10" fill="none" stroke="${p.dark}" stroke-opacity=".12" stroke-width="2"/>
      ${tassels}`;
  },
  tray(p) {
    let ring = '';
    for (let k = 0; k < 36; k++) {
      const a = (k / 36) * Math.PI * 2;
      ring += `<circle cx="${200 + 121 * Math.cos(a)}" cy="${196 + 121 * Math.sin(a)}" r="3.2" fill="${p.accent}"/>`;
    }
    let rosette = '';
    for (let k = 0; k < 12; k++) {
      rosette += `<ellipse cx="200" cy="144" rx="13" ry="36" fill="none" stroke="${p.accent}" stroke-width="2.5" transform="rotate(${k * 30} 200 196)"/>`;
    }
    return `<circle cx="208" cy="206" r="152" fill="${p.dark}" opacity=".14"/>
      <circle cx="200" cy="196" r="152" fill="${p.body}"/>
      <circle cx="200" cy="196" r="148" fill="none" stroke="${p.dark}" stroke-opacity=".35" stroke-width="5"/>
      <circle cx="200" cy="196" r="134" fill="none" stroke="${p.accent}" stroke-width="2.5"/>
      ${ring}
      <circle cx="200" cy="196" r="106" fill="none" stroke="${p.accent}" stroke-width="2.5"/>
      ${rosette}
      <circle cx="200" cy="196" r="22" fill="${p.accent}"/>
      <circle cx="200" cy="196" r="9" fill="${p.body}"/>
      ${shine('M96 140 C110 108 136 82 170 70')}`;
  },
  lantern(p) {
    let holes = '';
    for (let y = 150; y <= 280; y += 16) holes += dots(156, 244, y, 2.2, 6, p.dark);
    return `<ellipse cx="200" cy="215" rx="140" ry="120" fill="${p.accent}" opacity=".35"/>
      ${shadow(p, 80, 318)}
      <circle cx="200" cy="66" r="13" fill="none" stroke="${p.dark}" stroke-width="5"/>
      <path d="M146 132 L200 80 L254 132 Z" fill="${p.body}"/>
      <rect x="138" y="128" width="124" height="14" rx="3" fill="${p.body}"/>
      <rect x="138" y="128" width="124" height="14" rx="3" fill="${p.dark}" opacity=".3"/>
      <rect x="150" y="142" width="100" height="150" fill="${p.body}"/>
      ${holes}
      <path d="M160 274 V196 Q178 162 196 196 V274 Z" fill="${p.accent}"/>
      <path d="M204 274 V196 Q222 162 240 196 V274 Z" fill="${p.accent}"/>
      <rect x="140" y="290" width="120" height="14" rx="3" fill="${p.body}"/>
      <rect x="140" y="290" width="120" height="14" rx="3" fill="${p.dark}" opacity=".3"/>
      <rect x="150" y="304" width="12" height="12" fill="${p.body}"/><rect x="238" y="304" width="12" height="12" fill="${p.body}"/>`;
  },
  pot(p, id) {
    const body = 'M150 302 C128 302 118 272 126 240 C134 210 160 198 166 178 L170 150 H230 L234 178 C240 198 266 210 274 240 C282 272 272 302 250 302 Z';
    return `${shadow(p, 100, 318)}
      <path d="M138 238 C112 222 96 200 82 172 L96 166 C112 192 130 210 150 220 Z" fill="${p.body}"/>
      <path d="M266 214 C300 204 330 198 356 192" stroke="${p.dark}" stroke-width="11" stroke-linecap="round" fill="none"/>
      <clipPath id="${id}"><path d="${body}"/></clipPath>
      <path d="${body}" fill="${p.body}"/>
      <g clip-path="url(#${id})">
        <rect x="110" y="238" width="180" height="16" fill="${p.accent}" opacity=".9"/>
        ${dots(130, 270, 246, 3, 9, p.dark)}
        <rect x="110" y="270" width="180" height="3" fill="${p.accent}"/>
        ${shine('M146 240 C142 262 148 282 160 294')}
      </g>
      <rect x="164" y="136" width="72" height="16" rx="7" fill="${p.accent}"/>
      <circle cx="200" cy="128" r="9" fill="${p.accent}"/>`;
  },
  board(p, id) {
    const shape = 'M60 186 C60 174 70 168 82 168 H118 C124 158 136 150 152 150 H310 C328 150 340 164 340 182 V228 C340 246 328 260 310 260 H152 C136 260 124 252 118 242 H82 C70 242 60 236 60 224 Z';
    let grain = '';
    for (let k = 0; k < 7; k++) {
      const y = 166 + k * 14;
      grain += `<path d="M120 ${y} C170 ${y - 8} 220 ${y + 10} 270 ${y} S330 ${y - 6} 344 ${y + 2}" stroke="${k % 2 ? p.accent : p.dark}" stroke-opacity="${k % 2 ? 0.55 : 0.18}" stroke-width="3" fill="none"/>`;
    }
    return `<g transform="rotate(-9 200 205)">
        <path d="${shape}" fill="${p.dark}" opacity=".14" transform="translate(6 10)"/>
        <clipPath id="${id}"><path d="${shape}"/></clipPath>
        <path d="${shape}" fill="${p.body}"/>
        <g clip-path="url(#${id})">${grain}
          <ellipse cx="250" cy="204" rx="22" ry="10" fill="none" stroke="${p.dark}" stroke-opacity=".2" stroke-width="3"/>
        </g>
        <circle cx="80" cy="205" r="9" fill="${p.bg}"/>
      </g>`;
  },
  spoons(p) {
    const spoon = (a, len) => `<g transform="rotate(${a} 200 330)">
        <rect x="193" y="${330 - len}" width="14" height="${len}" rx="7" fill="${p.body}"/>
        <path d="M200 ${330 - len + 20} V318" stroke="${p.accent}" stroke-opacity=".6" stroke-width="2"/>
        <ellipse cx="200" cy="${330 - len - 30}" rx="30" ry="42" fill="${p.body}"/>
        <ellipse cx="200" cy="${330 - len - 32}" rx="20" ry="30" fill="${p.dark}" opacity=".2"/>
      </g>`;
    return `${shadow(p, 90, 336)}${spoon(-24, 150)}${spoon(24, 150)}${spoon(0, 170)}`;
  },
  pouf(p, id) {
    const side = 'M88 200 V268 C88 300 140 320 200 320 C260 320 312 300 312 268 V200 Z';
    let seams = '';
    for (let x = 108; x <= 300; x += 32) seams += `<path d="M${x} 210 V320" stroke="${p.dark}" stroke-opacity=".25" stroke-width="2"/>`;
    let top = '';
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      top += `<circle cx="${200 + 66 * Math.cos(a)}" cy="${200 + 21 * Math.sin(a)}" r="3" fill="${p.body}"/>`;
    }
    return `${shadow(p, 130, 330)}
      <clipPath id="${id}"><path d="${side}"/></clipPath>
      <path d="${side}" fill="${p.body}"/>
      <g clip-path="url(#${id})">
        ${seams}
        <path d="${zigzag(80, 320, 244, 22, 12)}" fill="${p.accent}"/>
        <path d="${zigzag(80, 320, 252, 14, 12)}" fill="${p.body}"/>
        ${dots(96, 304, 288, 3, 12, p.accent)}
      </g>
      <ellipse cx="200" cy="200" rx="112" ry="36" fill="${p.accent}"/>
      <ellipse cx="200" cy="200" rx="112" ry="36" fill="none" stroke="${p.dark}" stroke-opacity=".2" stroke-width="2"/>
      <ellipse cx="200" cy="200" rx="84" ry="27" fill="none" stroke="${p.body}" stroke-width="2.5"/>
      ${top}
      <ellipse cx="200" cy="200" rx="44" ry="14" fill="none" stroke="${p.body}" stroke-width="2.5"/>
      <ellipse cx="200" cy="200" rx="14" ry="5" fill="${p.body}"/>`;
  },
  bag(p) {
    return `${shadow(p, 120, 326)}
      <path d="M128 176 C128 70 272 70 272 176" stroke="${p.dark}" stroke-width="11" fill="none" stroke-linecap="round"/>
      <rect x="100" y="164" width="200" height="152" rx="18" fill="${p.body}"/>
      <path d="M100 182 C100 170 108 164 120 164 H280 C292 164 300 170 300 182 V236 C300 250 290 258 278 258 H122 C110 258 100 250 100 236 Z" fill="${p.dark}" opacity=".22"/>
      <path d="M110 186 V234 C110 242 116 248 124 248 H276 C284 248 290 242 290 234 V186" fill="none" stroke="${p.accent}" stroke-width="2" stroke-dasharray="6 5"/>
      <rect x="192" y="252" width="16" height="46" rx="3" fill="${p.dark}" opacity=".45"/>
      <rect x="184" y="236" width="32" height="32" rx="5" fill="none" stroke="#d9b45a" stroke-width="5"/>
      <rect x="198" y="236" width="4" height="32" fill="#d9b45a"/>`;
  },
  soap(p) {
    const bar = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill}"/>
      <ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 4}" ry="${h / 4}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3"/>`;
    let leaves = '';
    for (let k = 0; k < 5; k++) leaves += `<ellipse cx="${318 - k * 6}" cy="${150 + k * 26}" rx="9" ry="20" fill="#6f8a4a" transform="rotate(${k % 2 ? 35 : -35} ${318 - k * 6} ${150 + k * 26})"/>`;
    return `${shadow(p, 130, 318)}
      ${bar(96, 240, 190, 64, p.body)}
      ${bar(116, 182, 166, 60, p.accent)}
      ${bar(132, 128, 140, 56, '#b98a66')}
      <path d="M322 136 C312 190 304 240 300 300" stroke="#55703a" stroke-width="4" fill="none"/>${leaves}`;
  },
  candle(p) {
    let hex = '';
    for (let y = 176; y < 310; y += 30) {
      for (let x = 164; x < 240; x += 34) {
        const ox = ((y - 176) / 30) % 2 ? 17 : 0;
        const cx = x + ox;
        hex += `<path d="M${cx} ${y - 12} l10 6 v12 l-10 6 l-10 -6 v-12 Z" fill="none" stroke="${p.dark}" stroke-opacity=".14" stroke-width="2"/>`;
      }
    }
    return `<circle cx="200" cy="110" r="100" fill="${p.accent}" opacity=".7"/>
      ${shadow(p, 90, 326)}
      <rect x="148" y="150" width="104" height="170" rx="10" fill="${p.body}"/>
      ${hex}
      <ellipse cx="200" cy="152" rx="52" ry="11" fill="${p.accent}"/>
      <path d="M168 154 C168 172 176 176 178 166 C180 156 190 160 192 156 M222 156 C224 176 232 180 234 160" stroke="${p.accent}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <rect x="198" y="126" width="4" height="26" rx="2" fill="${p.dark}"/>
      <path d="M200 76 C216 98 216 118 200 130 C184 118 184 98 200 76 Z" fill="#f2a43a"/>
      <path d="M200 98 C208 110 208 120 200 126 C192 120 192 110 200 98 Z" fill="#fff4cf"/>`;
  },
};

/**
 * @param {{type: string, palette: string}} art
 * @param {{label?: string, className?: string, cover?: boolean}} [opts]
 *   cover: fill a non-square box by cropping (like CSS object-fit: cover)
 */
export function productArt(art, { label = '', className = '', cover = false } = {}) {
  const p = PALETTES[art.palette] || PALETTES.sand;
  const draw = DRAW[art.type] || DRAW.vase;
  const id = `art${++uid}`;
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  const fit = cover ? 'preserveAspectRatio="xMidYMid slice"' : '';
  return `<svg class="art ${className}" viewBox="0 0 400 400" ${fit} ${a11y} xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${p.bg}"/>
    <circle cx="200" cy="170" r="200" fill="#fff" opacity=".22"/>
    ${draw(p, id)}
  </svg>`;
}
