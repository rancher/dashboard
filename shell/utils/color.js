/*
Primary color classes from _light.scss

  --primary                    : #{$primary};
  --primary-text               : #{contrast-color($primary)};
  --primary-hover-bg           : #{darken($primary, 10%)};
  --primary-hover-text         : #{saturate($lightest, 20%)};
  --primary-active-bg          : #{darken($primary, 25%)};
  --primary-active-text        : #{contrast-color(darken($primary, 25%))};
  --primary-border             : #($primary);
  --primary-banner-bg          : #{rgba($primary, 0.15)};
  --primary-light-bg           : #{rgba($primary, 0.05)};

*/

const Color = require('color');

export function createCssVars(color, theme = 'light', name = 'primary') {
  const contrastOpts = theme === 'light' ? LIGHT_CONTRAST_COLORS : DARK_CONTRAST_COLORS;

  return {
    [`--${ name }`]:                color,
    [`--${ name }-text `]:          contrastColor(color, contrastOpts),
    [`--${ name }-hover-bg`]:       lighten(color, -10),
    [`--${ name }-active-bg`]:      lighten(color, -25),
    [`--${ name }-active-text`]:    contrastColor(lighten(color, -25), contrastOpts),
    [`--${ name }-border`]:         color,
    [`--${ name }-banner-bg`]:      opacity(color, 0.15),
    [`--${ name }-light-bg`]:       opacity(color, 0.05),
    [`--${ name }-keyboard-focus`]: lighten(color, -10),
  };
}

// scss 'lighten(color, percent)' increases color's hsl lightness by percent amount, not scaled
function lighten(color, amount) {
  const inHSL = Color(color)?.hsl()?.color;

  inHSL[2] -= amount;

  return Color.hsl(inHSL).rgb().string();
}

function opacity(color, val) {
  return Color(color).alpha(val).string();
}

/*
light theme
$contrasted-dark: $darkest !default;   #141419;
$contrasted-light: $lightest !default;  #FFFFFF

dark theme
$contrasted-dark: $lightest !default;  #ffffff;
$contrasted-light: $darkest !default; #141419
*/
const LIGHT_CONTRAST_COLORS = {
  dark:  'rgb(20, 20, 25)',
  light: 'rgb(255, 255, 255)'
};

const DARK_CONTRAST_COLORS = {
  dark:  'rgb(255, 255, 255)',
  light: 'rgb(20, 20, 25)',

};

const STANDARD_COLORS = {
  black: '#000000',
  white: '#ffffff',
};

// contrastColor(color, {light, dark}) returns which of 2 options is higher contrast with color
export function contrastColor(color, contrastOptions = LIGHT_CONTRAST_COLORS) {
  let out = contrastOptions.light;
  const contrastDark = Color(color).contrast(Color(contrastOptions.dark));
  const contrastLight = Color(color).contrast(Color(contrastOptions.light));

  if (contrastDark > contrastLight) {
    out = contrastOptions.dark;
  }

  return out;
}

export function parseColor(str) {
  return Color(str);
}

export function textColor(color) {
  const rgb = color.rgb().array();

  // http://www.w3.org/TR/AERT#color-contrast
  const brightness = Math.round(((parseInt(rgb[0]) * 299) +
                      (parseInt(rgb[1]) * 587) +
                      (parseInt(rgb[2]) * 114)) / 1000);

  return (brightness > 125) ? 'black' : 'white';
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function mapStandardColors(color) {
  return STANDARD_COLORS[color] || color;
}

export function rgbToRgb(rgb) {
  const result = /^rgb\(([0-9]{1,3}),\s*([0-9]{1,3}),\s*([0-9]{1,3})\)$/i.exec(rgb);

  return result ? {
    r: parseInt(result[1], 10),
    g: parseInt(result[2], 10),
    b: parseInt(result[3], 10)
  } : null;
}

export function colorToRgb(color) {
  let value;

  if (color.startsWith('rgb(')) {
    value = rgbToRgb(color);
  } else if (color.startsWith('#')) {
    value = hexToRgb(color);
  } else {
    console.warn(`Unable to parse color: ${ color }`); // eslint-disable-line no-console
  }

  return value || {
    r: 0, g: 0, b: 0
  };
}

export function normalizeHex(hex) {
  if (hex.includes('#') && hex.length === 4) {
    return `#${ hex[1] }${ hex[1] }${ hex[2] }${ hex[2] }${ hex[3] }${ hex[3] }`;
  } else if (!hex.includes('#') && hex.length === 3) {
    return `${ hex[0] }${ hex[0] }${ hex[1] }${ hex[1] }${ hex[2] }${ hex[2] }`;
  }

  return hex;
}
