/**
 * Finds hard-coded colors so lint rules can point them at the design system tokens.
 *
 * Shared by the ESLint rule `local-rules/no-color-literal` (scripts and templates) and the stylelint
 * rule of the same name (stylesheets and `<style>` blocks).
 */
const fs = require('fs');
const path = require('path');
const Color = require('color').default;

const REPO_ROOT = path.resolve(__dirname, '..');
const DESIGN_SYSTEM_DIR = 'pkg/rancher-components/src/components/design-system';
const DESIGN_SYSTEM_FILE = `${ DESIGN_SYSTEM_DIR }/_color-variables.scss`;
const STORYBOOK_URL = 'https://rancher.github.io/storybook/?path=/docs/foundation-color-primitives--docs';

const NOT_COLORS = new Set(['transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'revert', 'none']);

const COLOR_PROPERTIES = /^(-webkit-)?(color|background(-color|-image)?|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|border-image(-source)?|outline(-color)?|fill|stroke|stop-color|flood-color|lighting-color|caret-color|accent-color|column-rule(-color)?|text-decoration(-color)?|text-emphasis(-color)?|box-shadow|text-shadow|filter|backdrop-filter|mask(-image)?|scrollbar-color|text-fill-color|tap-highlight-color)$/i;

const COLOR_FUNCTION = /(?<![\w.-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark|contrast-color|darken|lighten|saturate|desaturate|adjust-hue|mix|tint|shade|transparentize|fade-out|fade-in|opacify|complement|scale-color|adjust-color|change-color|red|green|blue|hue|saturation|lightness|whiteness|blackness|alpha|sizzle-gradient|color\.[a-z-]+)\(/gi;

const COMPUTED_IN_STRING = /(?<![\w.-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\((?=\s*(var\(|from\s|in\s|\$\{))/gi;

const HEX_IN_STRING = /(^|[\s(,:'"`=])(#[0-9a-fA-F]{3,8})(?=$|[\s),;'"`])/g;
const HEX_IN_CSS = /(?<![\w&#-])#[0-9a-fA-F]{3,8}(?![\w-])/g;
const ISSUE_NUMBER = /^#\d{4}$/;
const RGB_TRIPLET = /^\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(\s*,\s*[\d.]+%?)?\s*$/;
const NAMED_WORD = /(?<![\w$#.@%-])[a-zA-Z]+(?![\w(-])/g;
const DECLARATION_IN_STRING = /(?<![\w-])([a-z][a-z-]*)\s*:\s*([^;'"`]*)/gi;

const isHexLength = (hex) => [4, 5, 7, 9].includes(hex.length);

function parseColor(raw) {
  try {
    const color = Color(raw.trim());

    return [...color.rgb().array().slice(0, 3).map(Math.round), Math.round(color.alpha() * 100) / 100];
  } catch (e) {
    return null;
  }
}

/**
 * Whether a word is a CSS named color such as `red` or `SaddleBrown`. Keywords that are not a color of their own
 * (`transparent`, `currentColor`, `inherit` and the like) are not.
 *
 * @param {string} word
 * @returns {boolean}
 */
function isNamedColor(word) {
  return /^[a-z]+$/i.test(word) && !NOT_COLORS.has(word.toLowerCase()) && parseColor(word) !== null;
}

/**
 * Whether a CSS property, or its camelCase name as used in a style object, takes a color.
 *
 * @param {string} name e.g. `border-color` or `backgroundColor`
 * @returns {boolean}
 */
function isColorProperty(name) {
  return COLOR_PROPERTIES.test(name.replace(/[A-Z]/g, (c) => `-${ c.toLowerCase() }`));
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
 * channels, color functions that compute a color (`rgba(var(--x), 0.5)`, `color-mix()`, relative colors,
 * template placeholders), and named colors in CSS declarations such as `'border: 1px solid red'`. A named color on
 * its own (`'red'`) is not reported, since plain words like that name states as often as colors.
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
    if (parseColor(match[0])) {
      found.push({ index: match.index, raw: match[0] });
    }
  }
  for (const match of text.matchAll(DECLARATION_IN_STRING)) {
    if (COLOR_PROPERTIES.test(match[1])) {
      const start = match.index + match[0].length - match[2].length;
      const value = match[2].replace(/url\([^)]*\)/gi, (m) => ' '.repeat(m.length));

      for (const word of value.matchAll(NAMED_WORD)) {
        if (isNamedColor(word[0])) {
          found.push({ index: start + word.index, raw: word[0] });
        }
      }
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
    for (const match of masked.matchAll(NAMED_WORD)) {
      if (isNamedColor(match[0]) && !inside(match.index)) {
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
  REPO_ROOT, DESIGN_SYSTEM_DIR, DESIGN_SYSTEM_FILE, STORYBOOK_URL, findInString, findInCss, message, isNamedColor, isColorProperty
};
