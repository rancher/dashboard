import path from 'path';
import * as sass from 'sass';
import { parseColor } from '@shell/utils/color';

const STYLES_DIR = path.resolve(__dirname, '..');

type Tokens = Record<string, string>;

/**
 * Collect the custom properties out of every block matching `selector`, merged in
 * source order so later declarations win as they would in the browser. Sass hoists
 * nested rules out of the theme blocks, which splits each theme across several
 * sibling blocks, so a theme is never a single block.
 */
function blockTokens(css: string, selector: RegExp): Tokens {
  const tokens: Tokens = {};

  for (const [, body] of css.matchAll(selector)) {
    for (const [, name, value] of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
      tokens[name] = value.trim();
    }
  }

  return tokens;
}

/**
 * Compile the modern theme plus the Rancher Prime (suse) overrides that sit on top
 * of it, and work out the tokens each theme actually resolves to on BODY.
 *
 * `shell/mixins/brand.js` puts the theme class and the brand class on BODY, so with
 * blocks written as `BODY, .theme-light`:
 *
 * - in light mode `.theme-light` (0,1,0) beats the dark block's bare `BODY` (0,0,1),
 *   so the light block wins for anything both define;
 * - but a token defined in only one block still lands on BODY in both themes, so it
 *   leaks across. `--body-border` is light-mode-only via this route.
 *
 * Prime's blocks are compound (`.suse.theme-light`, 0,2,0), so they never leak into
 * the other theme and always beat the modern theme.
 */
function compileThemes(): Record<'light' | 'dark' | 'primeLight' | 'primeDark', Tokens> {
  const { css } = sass.compileString(
    // `base/functions` supplies contrast-color(), which several tokens are built from
    `@import "base/functions"; @import "base/color"; @import "themes/modern"; @import "themes/suse";`,
    {
      loadPaths:           [STYLES_DIR],
      quietDeps:           true,
      silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
    }
  );

  const modernLight = blockTokens(css, /BODY, \.theme-light\s*\{([^{}]*)\}/g);
  const modernDark = blockTokens(css, /BODY, \.theme-dark\s*\{([^{}]*)\}/g);
  const suseCommon = blockTokens(css, /^\.suse\s*\{([^{}]*)\}/gm);
  const suseLight = blockTokens(css, /\.suse\.theme-light\s*\{([^{}]*)\}/g);
  const suseDark = blockTokens(css, /\.suse\.theme-dark\s*\{([^{}]*)\}/g);

  if (!Object.keys(modernLight).length || !Object.keys(modernDark).length || !Object.keys(suseLight).length || !Object.keys(suseDark).length) {
    throw new Error('Could not find every theme block in the compiled stylesheet');
  }

  const light = { ...modernDark, ...modernLight };
  const dark = { ...modernLight, ...modernDark };

  return {
    light,
    dark,
    primeLight: {
      ...light, ...suseCommon, ...suseLight
    },
    primeDark: {
      ...dark, ...suseCommon, ...suseDark
    },
  };
}

/**
 * Follow `var(--x)` indirection within a single theme until a literal colour is
 * reached.
 */
function resolve(tokens: Tokens, name: string, seen = new Set<string>()): string {
  const value = tokens[name];

  if (value === undefined) {
    throw new Error(`Token ${ name } is not defined in this theme`);
  }

  const ref = value.match(/^var\((--[\w-]+)\)$/);

  if (!ref) {
    return value;
  }

  if (seen.has(name)) {
    throw new Error(`Circular var() reference at ${ name }`);
  }
  seen.add(name);

  return resolve(tokens, ref[1], seen);
}

function ratio(tokens: Tokens, foreground: string, background: string): number {
  const fg = foreground.startsWith('--') ? resolve(tokens, foreground) : foreground;
  const bg = background.startsWith('--') ? resolve(tokens, background) : background;

  return parseColor(fg).contrast(parseColor(bg));
}

// WCAG 2.1 AA: 4.5:1 for body text (1.4.3), 3:1 for UI component boundaries (1.4.11)
const TEXT = 4.5;
const NON_TEXT = 3;

/**
 * Pairs that must hold in every theme. Inputs paint their own `--input-bg`, so a
 * placeholder is only ever seen on that; `--muted` is general secondary text and
 * does land on both the page and cards.
 */
const SHARED_PAIRS: [string, string, number][] = [
  // Form control boundaries - 1.4.11
  ['--input-border', '--input-bg', NON_TEXT],
  ['--input-border', '--box-bg', NON_TEXT],
  ['--dropdown-border', '--dropdown-bg', NON_TEXT],
  ['--checkbox-border', '--body-bg', NON_TEXT],
  ['--checkbox-border', '--box-bg', NON_TEXT],
  ['--secondary-border', '--body-bg', NON_TEXT],

  // Text - 1.4.3
  ['--input-placeholder', '--input-bg', TEXT],
  ['--muted', '--body-bg', TEXT],
  ['--muted', '--box-bg', TEXT],
  ['--on-tertiary', '--tertiary', TEXT],
  ['--on-tertiary-hover', '--tertiary-hover', TEXT],
  ['--on-secondary', '--secondary', TEXT],
  ['--on-secondary', '--secondary-hover', TEXT],
  ['--on-active', '--active', TEXT],
  ['--on-active', '--active-hover', TEXT],
  ['--on-active-nav', '--active-nav', TEXT],
  ['--on-active-nav', '--nav-active-hover', TEXT],
  ['--body-text', '--category-active', TEXT],
  ['--body-text', '--category-active-hover', TEXT],
  ['--primary-text', '--primary', TEXT],
  ['--primary-hover-text', '--primary-hover-bg', TEXT],
  ['--primary-active-text', '--primary-active-bg', TEXT],
  ['--rc-info', '--rc-info-secondary', TEXT],
];

describe('theme colour contrast (WCAG 2.1 AA)', () => {
  let themes: ReturnType<typeof compileThemes>;

  beforeAll(() => {
    themes = compileThemes();
  });

  describe.each([
    ['modern light', 'light'],
    ['modern dark', 'dark'],
    ['prime light', 'primeLight'],
    ['prime dark', 'primeDark'],
  ] as const)('%s', (_label, key) => {
    it.each(SHARED_PAIRS)('%s on %s meets %s:1', (foreground, background, min) => {
      expect(ratio(themes[key], foreground, background)).toBeGreaterThanOrEqual(min);
    });

    // The selected nav item borrows the CTA's hover fill rather than its rest fill, so it
    // reads as the same family without being mistakable for a button, and steps to the
    // pressed fill when hovered.
    it('paints the active nav item with the primary button family', () => {
      const tokens = themes[key];

      expect(resolve(tokens, '--active-nav')).toBe(resolve(tokens, '--primary-hover-bg'));
      expect(resolve(tokens, '--nav-active-hover')).toBe(resolve(tokens, '--primary-active-bg'));
      expect(resolve(tokens, '--on-active-nav')).toBe(resolve(tokens, '--primary-text'));
    });

    it('gives tertiary buttons a fill distinct from their hover state', () => {
      const tokens = themes[key];

      expect(resolve(tokens, '--tertiary')).not.toBe('transparent');
      expect(resolve(tokens, '--tertiary')).not.toBe(resolve(tokens, '--tertiary-hover'));
    });
  });

  describe('modern light', () => {
    it('keeps white button text legible on --rc-primary-hover', () => {
      expect(ratio(themes.light, '#FFFFFF', '--rc-primary-hover')).toBeGreaterThanOrEqual(TEXT);
    });
  });

  describe('prime light', () => {
    // Prime's selection used to be a solid $green-140, off the jungle ramp the buttons are
    // built from. Pointing it at the CTA's hover and pressed fills keeps it in that family.
    it('paints selection with the primary button family', () => {
      const tokens = themes.primeLight;

      expect(resolve(tokens, '--active')).toBe(resolve(tokens, '--primary-hover'));
      expect(resolve(tokens, '--active-hover')).toBe(resolve(tokens, '--primary-active-bg'));
    });

    // $green-20/$green-40 read minty as UI surfaces, so the tinted surfaces use the
    // desaturated $green-ui-* pair instead. One pair, shared, rather than a tint per component.
    it('tints every surface from a single green-ui pair', () => {
      const tokens = themes.primeLight;

      expect(resolve(tokens, '--category-active')).toBe(resolve(tokens, '--tertiary'));
      expect(resolve(tokens, '--category-active-hover')).toBe(resolve(tokens, '--tertiary-hover'));
      expect(resolve(tokens, '--secondary-hover')).toBe(resolve(tokens, '--tertiary'));
    });
  });
});
