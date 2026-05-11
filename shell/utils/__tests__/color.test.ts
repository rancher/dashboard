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
    it('parses a lowercase hex color', () => {
      expect(hexToRgb('#ff0080')).toStrictEqual({
        r: 255, g: 0, b: 128
      });
    });

    it('parses a hex color without # prefix', () => {
      expect(hexToRgb('ff0080')).toStrictEqual({
        r: 255, g: 0, b: 128
      });
    });

    it('parses an uppercase hex color', () => {
      expect(hexToRgb('#AABBCC')).toStrictEqual({
        r: 170, g: 187, b: 204
      });
    });

    it('returns null for an invalid hex string', () => {
      expect(hexToRgb('not-a-color')).toBeNull();
    });

    it('returns null for a short 3-character hex (not supported by hexToRgb)', () => {
      expect(hexToRgb('#abc')).toBeNull();
    });
  });

  describe('rgbToRgb', () => {
    it('parses a valid rgb() string', () => {
      expect(rgbToRgb('rgb(10, 20, 30)')).toStrictEqual({
        r: 10, g: 20, b: 30
      });
    });

    it('parses an rgb() string without spaces', () => {
      expect(rgbToRgb('rgb(0,128,255)')).toStrictEqual({
        r: 0, g: 128, b: 255
      });
    });

    it('returns null for an invalid rgb string', () => {
      expect(rgbToRgb('rgba(10,20,30,0.5)')).toBeNull();
    });

    it('returns null for a plain string', () => {
      expect(rgbToRgb('red')).toBeNull();
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
      expect(consoleSpy).toHaveBeenCalledWith('Unable to parse color: blue');
      consoleSpy.mockRestore();
    });
  });

  describe('normalizeHex', () => {
    it('expands a 3-char hex with # to 6-char', () => {
      expect(normalizeHex('#abc')).toStrictEqual('#aabbcc');
    });

    it('expands a 3-char hex without # to 6-char', () => {
      expect(normalizeHex('abc')).toStrictEqual('aabbcc');
    });

    it('returns a 6-char hex with # unchanged', () => {
      expect(normalizeHex('#aabbcc')).toStrictEqual('#aabbcc');
    });

    it('returns a 6-char hex without # unchanged', () => {
      expect(normalizeHex('aabbcc')).toStrictEqual('aabbcc');
    });
  });

  describe('mapStandardColors', () => {
    it('maps "black" to its hex value', () => {
      expect(mapStandardColors('black')).toStrictEqual('#000000');
    });

    it('maps "white" to its hex value', () => {
      expect(mapStandardColors('white')).toStrictEqual('#ffffff');
    });

    it('returns an unknown color string unchanged', () => {
      expect(mapStandardColors('#123456')).toStrictEqual('#123456');
    });
  });

  describe('textColor', () => {
    it('returns "black" for a light color', () => {
      const color = parseColor('#ffffff');

      expect(textColor(color)).toStrictEqual('black');
    });

    it('returns "white" for a dark color', () => {
      const color = parseColor('#000000');

      expect(textColor(color)).toStrictEqual('white');
    });

    it('returns "black" for a mid-brightness color above threshold', () => {
      // rgb(200,200,200) brightness ~ 200 > 125
      const color = parseColor('rgb(200, 200, 200)');

      expect(textColor(color)).toStrictEqual('black');
    });

    it('returns "white" for a mid-brightness color below threshold', () => {
      // rgb(50,50,50) brightness ~ 50 < 125
      const color = parseColor('rgb(50, 50, 50)');

      expect(textColor(color)).toStrictEqual('white');
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

      expect(vars).toHaveProperty('--primary');
      expect(vars).toHaveProperty('--primary-hover-bg');
      expect(vars).toHaveProperty('--primary-active-bg');
      expect(vars).toHaveProperty('--primary-border');
      expect(vars).toHaveProperty('--primary-banner-bg');
      expect(vars).toHaveProperty('--primary-light-bg');
      expect(vars).toHaveProperty('--primary-keyboard-focus');
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
