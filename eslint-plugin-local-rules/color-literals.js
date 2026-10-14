/**
 * Finds hard-coded colors so lint rules can point them at the design system tokens.
 *
 * Shared by the ESLint rule `local-rules/no-color-literal` (scripts and templates) and the stylelint
 * rule of the same name (stylesheets and `<style>` blocks).
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const DESIGN_SYSTEM_DIR = 'pkg/rancher-components/src/components/design-system';
const DESIGN_SYSTEM_FILE = `${ DESIGN_SYSTEM_DIR }/colors.scss`;
const STORYBOOK_URL = 'https://rancher.github.io/storybook/?path=/docs/foundation-color-primitives--docs';

const NAMED_COLORS = Object.fromEntries((
  'aliceblue:f0f8ff antiquewhite:faebd7 aqua:00ffff aquamarine:7fffd4 azure:f0ffff beige:f5f5dc bisque:ffe4c4 ' +
  'black:000000 blanchedalmond:ffebcd blue:0000ff blueviolet:8a2be2 brown:a52a2a burlywood:deb887 ' +
  'cadetblue:5f9ea0 chartreuse:7fff00 chocolate:d2691e coral:ff7f50 cornflowerblue:6495ed cornsilk:fff8dc ' +
  'crimson:dc143c cyan:00ffff darkblue:00008b darkcyan:008b8b darkgoldenrod:b8860b darkgray:a9a9a9 ' +
  'darkgreen:006400 darkgrey:a9a9a9 darkkhaki:bdb76b darkmagenta:8b008b darkolivegreen:556b2f darkorange:ff8c00 ' +
  'darkorchid:9932cc darkred:8b0000 darksalmon:e9967a darkseagreen:8fbc8f darkslateblue:483d8b ' +
  'darkslategray:2f4f4f darkslategrey:2f4f4f darkturquoise:00ced1 darkviolet:9400d3 deeppink:ff1493 ' +
  'deepskyblue:00bfff dimgray:696969 dimgrey:696969 dodgerblue:1e90ff firebrick:b22222 floralwhite:fffaf0 ' +
  'forestgreen:228b22 fuchsia:ff00ff gainsboro:dcdcdc ghostwhite:f8f8ff gold:ffd700 goldenrod:daa520 ' +
  'gray:808080 green:008000 greenyellow:adff2f grey:808080 honeydew:f0fff0 hotpink:ff69b4 indianred:cd5c5c ' +
  'indigo:4b0082 ivory:fffff0 khaki:f0e68c lavender:e6e6fa lavenderblush:fff0f5 lawngreen:7cfc00 ' +
  'lemonchiffon:fffacd lightblue:add8e6 lightcoral:f08080 lightcyan:e0ffff lightgoldenrodyellow:fafad2 ' +
  'lightgray:d3d3d3 lightgreen:90ee90 lightgrey:d3d3d3 lightpink:ffb6c1 lightsalmon:ffa07a lightseagreen:20b2aa ' +
  'lightskyblue:87cefa lightslategray:778899 lightslategrey:778899 lightsteelblue:b0c4de lightyellow:ffffe0 ' +
  'lime:00ff00 limegreen:32cd32 linen:faf0e6 magenta:ff00ff maroon:800000 mediumaquamarine:66cdaa ' +
  'mediumblue:0000cd mediumorchid:ba55d3 mediumpurple:9370db mediumseagreen:3cb371 mediumslateblue:7b68ee ' +
  'mediumspringgreen:00fa9a mediumturquoise:48d1cc mediumvioletred:c71585 midnightblue:191970 mintcream:f5fffa ' +
  'mistyrose:ffe4e1 moccasin:ffe4b5 navajowhite:ffdead navy:000080 oldlace:fdf5e6 olive:808000 olivedrab:6b8e23 ' +
  'orange:ffa500 orangered:ff4500 orchid:da70d6 palegoldenrod:eee8aa palegreen:98fb98 paleturquoise:afeeee ' +
  'palevioletred:db7093 papayawhip:ffefd5 peachpuff:ffdab9 peru:cd853f pink:ffc0cb plum:dda0dd ' +
  'powderblue:b0e0e6 purple:800080 rebeccapurple:663399 red:ff0000 rosybrown:bc8f8f royalblue:4169e1 ' +
  'saddlebrown:8b4513 salmon:fa8072 sandybrown:f4a460 seagreen:2e8b57 seashell:fff5ee sienna:a0522d ' +
  'silver:c0c0c0 skyblue:87ceeb slateblue:6a5acd slategray:708090 slategrey:708090 snow:fffafa ' +
  'springgreen:00ff7f steelblue:4682b4 tan:d2b48c teal:008080 thistle:d8bfd8 tomato:ff6347 turquoise:40e0d0 ' +
  'violet:ee82ee wheat:f5deb3 white:ffffff whitesmoke:f5f5f5 yellow:ffff00 yellowgreen:9acd32'
).split(' ').map((pair) => pair.split(':')));

const NOT_COLORS = new Set(['transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'revert', 'none']);

const COLOR_PROPERTIES = /^(color|background(-color)?|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|fill|stroke|stop-color|flood-color|lighting-color|caret-color|accent-color|column-rule(-color)?|text-decoration(-color)?|text-emphasis(-color)?|box-shadow|text-shadow|scrollbar-color|-webkit-text-fill-color|-webkit-tap-highlight-color)$/i;

const COLOR_FUNCTION = /(?<![\w.-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark|contrast-color|darken|lighten|saturate|desaturate|adjust-hue|mix|tint|shade|transparentize|fade-out|fade-in|opacify|complement|scale-color|adjust-color|change-color|red|green|blue|hue|saturation|lightness|whiteness|blackness|alpha|sizzle-gradient|color\.[a-z-]+)\(/gi;

const COMPUTED_IN_STRING = /(?<![\w.-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\((?=\s*(var\(|from\s|in\s|\$\{))/gi;

const HEX_IN_STRING = /(^|[\s(,:'"`=])(#[0-9a-fA-F]{3,8})(?=$|[\s),;'"`])/g;
const HEX_IN_CSS = /(?<![\w&#-])#[0-9a-fA-F]{3,8}(?![\w-])/g;
const ISSUE_NUMBER = /^#\d{4}$/;
const RGB_TRIPLET = /^\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(\s*,\s*[\d.]+%?)?\s*$/;

const isHexLength = (hex) => [4, 5, 7, 9].includes(hex.length);

function parseHex(hex) {
  let digits = hex.slice(1);

  if (![3, 4, 6, 8].includes(digits.length)) {
    return null;
  }
  if (digits.length <= 4) {
    digits = [...digits].map((d) => d + d).join('');
  }
  const channel = (i) => parseInt(digits.slice(i, i + 2), 16);

  return [channel(0), channel(2), channel(4), digits.length === 8 ? Math.round(channel(6) / 255 * 100) / 100 : 1];
}

function parseColorFunction(text) {
  const match = text.match(/^(rgba?|hsla?)\(([^()]*)\)$/i);
  const parts = match && match[2].split(/[\s,/]+/).filter(Boolean);

  if (!parts || parts.length < 3 || parts.length > 4 || parts.some((p) => !/^-?[\d.]+(%|deg)?$/.test(p))) {
    return null;
  }
  const number = (p, max) => (p.endsWith('%') ? parseFloat(p) / 100 * max : parseFloat(p));
  const alpha = parts[3] === undefined ? 1 : Math.round(number(parts[3], 1) * 100) / 100;

  if (match[1].toLowerCase().startsWith('rgb')) {
    return [...parts.slice(0, 3).map((p) => Math.round(number(p, 255))), alpha];
  }
  const h = ((parseFloat(parts[0]) % 360) + 360) % 360 / 360;
  const s = number(parts[1], 1);
  const l = number(parts[2], 1);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    t = (t + 1) % 1;

    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
  };

  return [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)].map((v) => Math.round(v * 255)).concat(alpha);
}

function parseColor(raw) {
  const text = raw.trim();
  const name = text.toLowerCase();

  if (text.startsWith('#')) {
    return parseHex(text);
  }
  if (NAMED_COLORS[name]) {
    return parseHex(`#${ NAMED_COLORS[name] }`);
  }

  return parseColorFunction(text);
}

let tokens = new Map();
let tokensModified;

function designSystemTokens() {
  const file = path.join(REPO_ROOT, DESIGN_SYSTEM_DIR, '_color-variables.scss');
  const modified = fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0;

  if (modified !== tokensModified) {
    tokensModified = modified;
    tokens = new Map();

    for (const [, name, value] of (modified ? fs.readFileSync(file, 'utf8') : '').matchAll(/^\$(color-[\w-]+)\s*:\s*([^;]+);/gm)) {
      const rgba = parseColor(value);

      if (rgba && !tokens.has(rgba.join())) {
        tokens.set(rgba.join(), `--${ name }`);
      }
    }
  }

  return tokens;
}

/**
 * The lint message for a hard-coded color: the matching token when the design system has the color,
 * otherwise where to add one.
 *
 * @param {string} raw the color as written, e.g. `#fff`, `rgba(0, 0, 0, 0.5)` or `darken($primary, 10%)`
 * @returns {string}
 */
function message(raw) {
  const color = raw.replace(/\s+/g, ' ');
  const rgba = parseColor(raw);

  if (!rgba && /^[\w.-]+\(/.test(raw.trim())) {
    return `Computed color "${ color }": use the primitive (or theme variable) it should be instead of computing it, and add a primitive to ${ DESIGN_SYSTEM_FILE } if there is none. Colors come from the design system, see ${ STORYBOOK_URL }`;
  }
  const token = rgba && designSystemTokens().get(rgba.join());
  const fix = token ? `use var(${ token })` : `add a primitive to ${ DESIGN_SYSTEM_FILE } and use that`;

  return `Hard-coded color "${ color }": ${ fix }. Colors come from the design system, see ${ STORYBOOK_URL }`;
}

function closingParen(text, open) {
  let depth = 0;

  for (let i = open; i < text.length; i++) {
    if (text[i] === '(') {
      depth++;
    } else if (text[i] === ')' && --depth === 0) {
      return i;
    }
  }

  return text.length - 1;
}

/**
 * Colors in a string literal from a script or a template attribute: hex colors, `rgb()`/`hsl()` with literal
 * channels, and color functions that compute a color (`rgba(var(--x), 0.5)`, `color-mix()`, relative colors,
 * template placeholders). Named colors are not reported.
 *
 * @param {string} text the literal as it appears in the source, quotes included
 * @returns {{ index: number, raw: string }[]} each color and its offset in `text`
 */
function findInString(text) {
  const found = [];

  for (const match of text.matchAll(HEX_IN_STRING)) {
    if (isHexLength(match[2]) && !ISSUE_NUMBER.test(match[2])) {
      found.push({ index: match.index + match[1].length, raw: match[2] });
    }
  }
  for (const match of text.matchAll(/(?<![\w.-])(rgba?|hsla?)\([^()]*\)/gi)) {
    if (parseColorFunction(match[0])) {
      found.push({ index: match.index, raw: match[0] });
    }
  }
  for (const match of text.matchAll(COMPUTED_IN_STRING)) {
    const end = closingParen(text, match.index + match[0].length - 1);
    const raw = text.slice(match.index, end + 1).replace(/(['"`]|\$\{)[\s\S]*$/, '');

    found.push({ index: match.index, raw });
  }

  return found.sort((a, b) => a.index - b.index);
}

/**
 * Colors in a CSS or SCSS value: hex colors, color functions (including the ones that compute a color, such
 * as Sass `darken()`, `contrast-color()` and `red()`, and CSS `color-mix()` and relative colors), named colors
 * in properties that take a color, and `r, g, b` triplets assigned to custom properties or Sass variables.
 * `url()` and quoted strings are skipped.
 *
 * @param {string} value the declaration value as written
 * @param {string} [property] the declaration property, `--custom` property or `$variable`
 * @returns {{ index: number, raw: string }[]} each color and its offset in `value`
 */
function findInCss(value, property = '') {
  const masked = value.replace(/url\([^)]*\)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gi, (m) => ' '.repeat(m.length));
  const isVariable = property.startsWith('--') || property.startsWith('$');
  const found = [];
  const taken = [];
  const inside = (index) => taken.some(([start, end]) => index >= start && index <= end);

  for (const match of masked.matchAll(COLOR_FUNCTION)) {
    if (inside(match.index)) {
      continue;
    }
    const end = closingParen(masked, match.index + match[0].length - 1);

    taken.push([match.index, end]);
    found.push({ index: match.index, raw: value.slice(match.index, end + 1) });
  }
  for (const match of masked.matchAll(HEX_IN_CSS)) {
    if (isHexLength(match[0]) && !inside(match.index)) {
      found.push({ index: match.index, raw: match[0] });
    }
  }
  if (isVariable || COLOR_PROPERTIES.test(property)) {
    for (const match of masked.matchAll(/(?<![\w$#.@%-])[a-zA-Z]+(?![\w(-])/g)) {
      const word = match[0].toLowerCase();

      if (NAMED_COLORS[word] && !NOT_COLORS.has(word) && !inside(match.index)) {
        found.push({ index: match.index, raw: match[0] });
      }
    }
  }
  if (isVariable && RGB_TRIPLET.test(masked)) {
    const start = masked.search(/\S/);

    found.push({ index: start, raw: value.trim() });
  }

  return found.sort((a, b) => a.index - b.index);
}

module.exports = {
  REPO_ROOT, DESIGN_SYSTEM_DIR, DESIGN_SYSTEM_FILE, STORYBOOK_URL, findInString, findInCss, message
};
