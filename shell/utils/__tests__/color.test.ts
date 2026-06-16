import {
  contrastColor,
  parseColor,
  textColor,
  hexToRgb,
  mapStandardColors,
  rgbToRgb,
  colorToRgb,
  normalizeHex,
  createCssVars,
} from '@shell/utils/color';

describe('shell/utils/color', () => {
  describe('hexToRgb', () => {
    it.each([
      {
        desc:     'a lowercase hex color',
        input:    '#ff0080',
        expected: {
          r: 255, g: 0, b: 128
        },
      },
      {
        desc:     'a hex color without # prefix',
        input:    'ff0080',
        expected: {
          r: 255, g: 0, b: 128
        },
      },
      {
        desc:     'an uppercase hex color',
        input:    '#AABBCC',
        expected: {
          r: 170, g: 187, b: 204
        },
      },
    ])('parses $desc', ({ input, expected }) => {
      expect(hexToRgb(input)).toStrictEqual(expected);
    });

    it.each([
      { desc: 'an invalid hex string', input: 'not-a-color' },
      { desc: 'a short 3-character hex (not supported by hexToRgb)', input: '#abc' },
    ])('returns null for $desc', ({ input }) => {
      expect(hexToRgb(input)).toBeNull();
    });
  });

  describe('rgbToRgb', () => {
    it.each([
      {
        desc:     'a valid rgb() string with spaces',
        input:    'rgb(10, 20, 30)',
        expected: {
          r: 10, g: 20, b: 30
        },
      },
      {
        desc:     'an rgb() string without spaces',
        input:    'rgb(0,128,255)',
        expected: {
          r: 0, g: 128, b: 255
        },
      },
    ])('parses $desc', ({ input, expected }) => {
      expect(rgbToRgb(input)).toStrictEqual(expected);
    });

    it.each([
      { desc: 'an rgba string', input: 'rgba(10,20,30,0.5)' },
      { desc: 'a plain color name', input: 'red' },
    ])('returns null for $desc', ({ input }) => {
      expect(rgbToRgb(input)).toBeNull();
    });
  });

  describe('colorToRgb', () => {
    it('converts a hex color to rgb object', () => {
      expect(colorToRgb('#ff0000')).toStrictEqual({
        r: 255, g: 0, b: 0
      });
    });

    it('converts an rgb() string to rgb object', () => {
      expect(colorToRgb('rgb(0, 0, 255)')).toStrictEqual({
        r: 0, g: 0, b: 255
      });
    });

    it('returns { r:0, g:0, b:0 } for an unrecognized format', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(colorToRgb('hsl(0,100%,50%)')).toStrictEqual({
        r: 0, g: 0, b: 0
      });
      consoleSpy.mockRestore();
    });

    it('warns for unrecognized color formats', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      colorToRgb('blue');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unable to parse color: blue'));
      consoleSpy.mockRestore();
    });
  });

  describe('normalizeHex', () => {
    it.each([
      {
        desc: '3-char hex with # to 6-char', input: '#abc', expected: '#aabbcc'
      },
      {
        desc: '3-char hex without # to 6-char', input: 'abc', expected: 'aabbcc'
      },
      {
        desc: '6-char hex with # unchanged', input: '#aabbcc', expected: '#aabbcc'
      },
      {
        desc: '6-char hex without # unchanged', input: 'aabbcc', expected: 'aabbcc'
      },
    ])('handles $desc', ({ input, expected }) => {
      expect(normalizeHex(input)).toStrictEqual(expected);
    });
  });

  describe('mapStandardColors', () => {
    it.each([
      {
        desc: '"black" to its hex value', input: 'black', expected: '#000000'
      },
      {
        desc: '"white" to its hex value', input: 'white', expected: '#ffffff'
      },
      {
        desc: 'an unknown color string unchanged', input: '#123456', expected: '#123456'
      },
    ])('maps $desc', ({ input, expected }) => {
      expect(mapStandardColors(input)).toStrictEqual(expected);
    });
  });

  describe('textColor', () => {
    it.each([
      {
        desc: '"black" for a light color (#ffffff)', input: '#ffffff', expected: 'black'
      },
      {
        desc: '"white" for a dark color (#000000)', input: '#000000', expected: 'white'
      },
      {
        desc: '"black" for brightness above threshold (rgb 200,200,200)', input: 'rgb(200, 200, 200)', expected: 'black'
      },
      {
        desc: '"white" for brightness below threshold (rgb 50,50,50)', input: 'rgb(50, 50, 50)', expected: 'white'
      },
    ])('returns $desc', ({ input, expected }) => {
      const color = parseColor(input);

      expect(textColor(color)).toStrictEqual(expected);
    });
  });

  describe('contrastColor', () => {
    it('returns light text on a very dark background (light theme)', () => {
      expect(contrastColor('#000000')).toStrictEqual('rgb(255, 255, 255)');
    });

    it('returns dark text on a very light background (light theme)', () => {
      expect(contrastColor('#ffffff')).toStrictEqual('rgb(20, 20, 25)');
    });

    it('uses custom contrast options when provided', () => {
      const opts = { dark: '#000000', light: '#ffffff' };

      // white background → dark text has higher contrast
      expect(contrastColor('#ffffff', opts)).toStrictEqual('#000000');
    });
  });

  describe('createCssVars', () => {
    it('returns an object with expected CSS variable keys for light theme', () => {
      const vars = createCssVars('#4a90d9', 'light', 'primary');
      const expectedKeys = [
        '--primary',
        '--primary-text ',
        '--primary-hover-bg',
        '--primary-active-bg',
        '--primary-active-text',
        '--primary-border',
        '--primary-banner-bg',
        '--primary-light-bg',
        '--primary-keyboard-focus',
      ];

      expect(Object.keys(vars)).toStrictEqual(expectedKeys);
    });

    it('sets --primary to the input color', () => {
      const vars = createCssVars('#4a90d9');

      expect(vars['--primary']).toStrictEqual('#4a90d9');
    });

    it('sets --primary-border to the input color', () => {
      const vars = createCssVars('#4a90d9');

      expect(vars['--primary-border']).toStrictEqual('#4a90d9');
    });

    it('uses a custom name prefix', () => {
      const vars = createCssVars('#ff0000', 'light', 'accent');

      expect(vars).toHaveProperty('--accent');
      expect(vars).toHaveProperty('--accent-hover-bg');
    });

    it('produces opacity-based banner-bg and light-bg values', () => {
      const vars = createCssVars('#ff0000');

      // opacity(color, 0.15) and opacity(color, 0.05) produce rgba strings
      expect(vars['--primary-banner-bg']).toContain('rgba');
      expect(vars['--primary-light-bg']).toContain('rgba');
    });
  });
});
