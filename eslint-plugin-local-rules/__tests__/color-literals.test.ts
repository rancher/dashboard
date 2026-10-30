const {
  findInCss, findInString, message, colorInMessage
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
      ['background-image', 'linear-gradient(white, black)', ['white', 'black']],
      ['border-image', 'linear-gradient(red, blue) 1', ['red', 'blue']],
      ['filter', 'drop-shadow(0 0 2px black)', ['black']],
      ['-webkit-box-shadow', '0 0 2px black', ['black']],
      ['mask-image', 'linear-gradient(black, transparent)', ['black']],
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
      ["'border: 1px solid red'", ['red']],
      ["'color: SaddleBrown; background: white'", ['SaddleBrown', 'white']],
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
      ["'red'"],
      ["'Status: red'"],
      ["'background: url(red.png)'"],
    ])('ignores %s', (text) => {
      expect(findInString(text)).toStrictEqual([]);
    });
  });

  describe('message', () => {
    it('asks for a theme variable instead of a hard-coded color', () => {
      expect(message('#FFF')).toStrictEqual('Hard-coded color "#FFF": use a theme variable, such as var(--primary), instead. If you decide to add a new color, check with UX before adding it and giving it a name.');
    });

    it('asks for a theme variable instead of a computed color', () => {
      expect(message('darken($primary, 10%)')).toStrictEqual('Computed color "darken($primary, 10%)": use a theme variable instead of computing a color. If you decide to add a new color, check with UX before adding it and giving it a name.');
    });

    it('collapses the whitespace in the color', () => {
      expect(message('rgba(0,\n    0, 0, 0.5)')).toContain('"rgba(0, 0, 0, 0.5)"');
    });
  });

  describe('colorInMessage', () => {
    it.each([
      ['#FFF'],
      ['darken($primary, 10%)'],
      ['rgba(0, 0, 0, 0.5)'],
    ])('reads %s back from its message', (color) => {
      expect(colorInMessage(message(color))).toStrictEqual(color);
    });

    it('reads the color from a stylelint warning, which ends with the rule name', () => {
      expect(colorInMessage(`${ message('#fff') } (local-rules/no-color-literal)`)).toStrictEqual('#fff');
    });

    it('returns undefined for a message from another rule', () => {
      expect(colorInMessage('Unexpected console statement.')).toBeUndefined();
    });
  });
});
