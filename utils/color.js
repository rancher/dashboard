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

import { listCssCustomProperties } from '~/utils/css-rule-parser';

const Color = require('color');

export function createCssVars(color, theme = 'light', name = 'primary') {
  const contrastOpts = theme === 'light' ? LIGHT_CONTRAST_COLORS : DARK_CONTRAST_COLORS;

  return {
    [`--${ name }`]:             color,
    [`--${ name }-text `]:       contrastColor(color, contrastOpts),
    [`--${ name }-hover-bg`]:    lighten(color, -10),
    [`--${ name }-active-bg`]:   lighten(color, -25),
    [`--${ name }-active-text`]: contrastColor(lighten(color, -25), contrastOpts),
    [`--${ name }-border`]:      color,
    [`--${ name }-banner-bg`]:   opacity(color, 0.15),
    [`--${ name }-light-bg`]:    opacity(color, 0.05),
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

// contrastColor(color, {light, dark}) returns which of 2 options is higher contrast with color
function contrastColor(color, contrastOptions = LIGHT_CONTRAST_COLORS) {
  let out = contrastOptions.light;
  const contrastDark = Color(color).contrast(Color(contrastOptions.dark));
  const contrastLight = Color(color).contrast(Color(contrastOptions.light));

  if (contrastDark > contrastLight) {
    out = contrastOptions.dark;
  }

  return out;
}

/**
 * Filters the imported CSS vars from the document based on the theme.
 *
 * @param {('theme-light' | 'theme-dark' )} themeName - Theme name to filter by
 *
 * @description - listCssCustomProperties will retrieve all the custom css vars associated with that theme.
 *                It will then translate the kebab-cased vars to camelCase.
 *                e.g. --header-text-color to headerTextColor.
 *
 * @example
 * // returns { primaryText: #000000 }
 * getScssThemeVars('thme-light')
 *
 * @example
 * // returns { primaryText: #B6B6C2 }
 * getScssThemeVars('theme-dark')
 */
export function getCssThemeVarsFromDocument(themeName = 'theme-light') {
  return listCssCustomProperties(themeName).reduce((cssMap, curr) => {
    const key = curr[0].replace('--', '').replace(/-./g, x => x[1].toUpperCase());

    cssMap[key] = curr[1];

    return cssMap;
  }, {});
}
