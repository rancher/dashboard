import path from 'path';
import * as sass from 'sass';

const STYLES_DIR = path.resolve(__dirname, '../..');

function blockDeclarations(css: string, selector: RegExp): Record<string, string> {
  const declarations: Record<string, string> = {};

  for (const [, body] of css.matchAll(selector)) {
    for (const [, name, value] of body.matchAll(/([\w-]+):\s*([^;]+);/g)) {
      declarations[name] = value.trim();
    }
  }

  return declarations;
}

describe('tooltip stylesheet', () => {
  let css: string;

  beforeAll(() => {
    ({ css } = sass.compileString(
      `@import "base/variables"; @import "base/functions"; @import "global/tooltip";`,
      {
        loadPaths:           [STYLES_DIR],
        quietDeps:           true,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
      }
    ));
  });

  it('borders popovers', () => {
    expect(blockDeclarations(css, /^\.v-popper__popper\s*\{([^{}]*)\}/gm).border).toBe('1px solid var(--border)');
  });

  describe('tooltips', () => {
    let declarations: Record<string, string>;

    beforeAll(() => {
      declarations = blockDeclarations(css, /^\.v-popper__popper\.v-popper--theme-tooltip\s*\{([^{}]*)\}/gm);
    });

    it('hide the popover border colour', () => {
      expect(declarations['border-color']).toBe('transparent');
    });

    it('override no other border property, so the popover border keeps the arrow off its anchor', () => {
      expect(Object.keys(declarations).filter((name) => name.startsWith('border'))).toStrictEqual(['border-color']);
    });
  });
});
