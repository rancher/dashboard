import path from 'path';
import * as sass from 'sass';
import { parseColor } from '@shell/utils/color';

const STYLES_DIR = path.resolve(__dirname, '..');

type Tokens = Record<string, string>;

/**
 * Compile the modern theme and pull the custom properties out of its theme
 * blocks. Sass hoists nested rules out of `BODY, .theme-light` / `BODY, .theme-dark`,
 * which splits each theme across several sibling blocks - so every block for a
 * theme is merged in source order, letting later declarations win as they would
 * in the browser.
 */
function compileThemes(): { light: Tokens, dark: Tokens } {
  const { css } = sass.compileString(
    `@import "base/color"; @import "themes/modern";`,
    {
      loadPaths:           [STYLES_DIR],
      quietDeps:           true,
      silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
    }
  );

  const themes: { light: Tokens, dark: Tokens } = { light: {}, dark: {} };

  for (const [, theme, body] of css.matchAll(/BODY, \.theme-(light|dark)\s*\{([^{}]*)\}/g)) {
    for (const [, name, value] of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
      themes[theme as 'light' | 'dark'][name] = value.trim();
    }
  }

  if (!Object.keys(themes.light).length || !Object.keys(themes.dark).length) {
    throw new Error('Could not find both theme blocks in the compiled modern theme');
  }

  return themes;
}

/**
 * Follow `var(--x)` indirection within a single theme block until a literal
 * colour is reached.
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

describe('modern theme colour contrast (WCAG 2.1 AA)', () => {
  let light: Tokens;
  let dark: Tokens;

  beforeAll(() => {
    ({ light, dark } = compileThemes());
  });

  describe('light theme', () => {
    it.each([
      // Form control boundaries - 1.4.11
      ['--input-border', '--input-bg', NON_TEXT],
      ['--input-border', '--box-bg', NON_TEXT],
      ['--dropdown-border', '--dropdown-bg', NON_TEXT],
      ['--checkbox-border', '--body-bg', NON_TEXT],
      ['--rc-active-border', '--rc-active-background', NON_TEXT],
      ['--rc-inactive-border', '--rc-inactive-background', NON_TEXT],

      // Text - 1.4.3
      ['--input-placeholder', '--input-bg', TEXT],
      ['--on-tertiary', '--tertiary', TEXT],
      ['--on-tertiary-hover', '--tertiary-hover', TEXT],
      ['--on-active', '--active', TEXT],
      ['--rc-info', '--rc-info-secondary', TEXT],
    ])('%s on %s meets %s:1', (foreground, background, min) => {
      expect(ratio(light, foreground, background)).toBeGreaterThanOrEqual(min);
    });

    it('keeps white button text legible on --rc-primary-hover', () => {
      expect(ratio(light, '#FFFFFF', '--rc-primary-hover')).toBeGreaterThanOrEqual(TEXT);
    });

    it('keeps white text legible on the hovered selected nav row', () => {
      expect(ratio(light, '--on-active', '--active-hover')).toBeGreaterThanOrEqual(TEXT);
    });

    it('keeps body text legible on the active category row', () => {
      expect(ratio(light, '--body-text', '--category-active')).toBeGreaterThanOrEqual(TEXT);
    });
  });

  describe('dark theme', () => {
    it.each([
      ['--input-border', '--body-bg', NON_TEXT],
      ['--input-border', '--box-bg', NON_TEXT],
      ['--on-active', '--active', TEXT],
    ])('%s on %s meets %s:1', (foreground, background, min) => {
      expect(ratio(dark, foreground, background)).toBeGreaterThanOrEqual(min);
    });
  });
});
