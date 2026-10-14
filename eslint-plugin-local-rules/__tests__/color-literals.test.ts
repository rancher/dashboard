const {
  findInCss, findInString, message, DESIGN_SYSTEM_FILE, STORYBOOK_URL
} = require('../color-literals');

const raws = (found: { raw: string }[]) => found.map((f) => f.raw);

describe('color-literals', () => {
  describe('findInCss', () => {
    it.each([
      ['color', '#FFF', ['#FFF']],
      ['background', 'rgba(0, 0, 0, 0.5)', ['rgba(0, 0, 0, 0.5)']],
      ['--primary-banner-bg', '#{rgba($primary, 0.15)}', ['rgba($primary, 0.15)']],
      ['$selected', 'rgba(#3D98D3, .5)', ['rgba(#3D98D3, .5)']],
      ['background-color', 'darken(#EBEEF5, 15%)', ['darken(#EBEEF5, 15%)']],
      ['background-color', 'hsl(from var(--primary) h s calc(l + 30))', ['hsl(from var(--primary) h s calc(l + 30))']],
      ['border', '1px solid red', ['red']],
      ['--sizzle-0', '180, 210, 30', ['180, 210, 30']],
      ['--primary-text', '#{contrast-color($primary)}', ['contrast-color($primary)']],
      ['--sizzle-1', '#{red($color-red-405)}, #{green($color-red-405)}, #{blue($color-red-405)}', ['red($color-red-405)', 'green($color-red-405)', 'blue($color-red-405)']],
      ['background', 'sizzle-gradient($success)', ['sizzle-gradient($success)']],
      ['background', 'color-mix(in srgb, var(--primary) 15%, transparent)', ['color-mix(in srgb, var(--primary) 15%, transparent)']],
      ['--app-color1-accent', 'rgba(var(--sizzle-1), 1)', ['rgba(var(--sizzle-1), 1)']],
    ])('reports %s: %s', (property, value, expected) => {
      expect(raws(findInCss(value, property))).toStrictEqual(expected);
    });

    it.each([
      ['color', 'var(--color-gray-96)'],
      ['background', 'transparent'],
      ['color', 'currentColor'],
      ['transition', 'color 0.3s ease'],
      ['font-family', 'Lato, sans-serif'],
      ['filter', 'invert(100%)'],
      ['content', '"#fff"'],
      ['background', 'url("data:image/svg+xml;utf8,<svg fill=%23fff>")'],
      ['--gap', '8px'],
    ])('ignores %s: %s', (property, value) => {
      expect(findInCss(value, property)).toStrictEqual([]);
    });

    it('returns the offset of each color in the value', () => {
      expect(findInCss('1px solid #fff', 'border')).toStrictEqual([{ index: 10, raw: '#fff' }]);
    });
  });

  describe('findInString', () => {
    it.each([
      ["'#F64747'", ['#F64747']],
      ["'var(--primary, #3D98D3)'", ['#3D98D3']],
      ["'rgb(20, 20, 25)'", ['rgb(20, 20, 25)']],
      ['`<use fill="#fff" />`', ['#fff']],
      ["'rgba(var(--x), 0.5)'", ['rgba(var(--x), 0.5)']],
      ["'color-mix(in srgb, var(--rc-cm-bg) 75%, transparent)'", ['color-mix(in srgb, var(--rc-cm-bg) 75%, transparent)']],
      ['`rgba(var(${', ['rgba(var(']],
      ['`rgb(${', ['rgb(']],
    ])('reports %s', (text, expected) => {
      expect(raws(findInString(text))).toStrictEqual(expected);
    });

    it.each([
      ["'see issue #9341'"],
      ["'/dashboard/#abc'"],
      ["'#app'"],
      ["'icon-color-red'"],
      ["'Pick a color (optional)'"],
      ["'var(--primary-held-bg)'"],
      ["'rgb('"],
    ])('ignores %s', (text) => {
      expect(findInString(text)).toStrictEqual([]);
    });
  });

  describe('message', () => {
    it('names the design system token when the color has one', () => {
      expect(message('#FFF')).toContain('use var(--color-white)');
    });

    it('points at the design system file when the color has no token', () => {
      expect(message('#123457')).toContain(`add a primitive to ${ DESIGN_SYSTEM_FILE }`);
    });

    it('asks for a primitive instead of a computed color', () => {
      expect(message('darken($primary, 10%)')).toContain('Computed color "darken($primary, 10%)": use the primitive');
    });

    it('links the Storybook page of the color primitives', () => {
      expect(message('#FFF')).toContain(STORYBOOK_URL);
    });
  });
});
