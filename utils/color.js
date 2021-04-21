import { isArray } from '@/utils/array';

/*
RGB/HSL conversion functions are borrowed from CSS-Tricks (visited 4/14/21)
https://css-tricks.com/converting-color-spaces-in-javascript/
*/
export function RGBToHSL(r, g, b) {
  // Make r, g, and b fractions of 1
  r = r / 255;
  g = g / 255;
  b = b / 255;

  // Find greatest and smallest channel values
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = 0;

  // Calculate hue
  // No difference
  if (delta == 0) {
    h = 0;
  }
  // Red is max
  else if (cmax == r) {
    h = ((g - b) / delta) % 6;
  }
  // Green is max
  else if (cmax == g) {
    h = (b - r) / delta + 2;
  }
  // Blue is max
  else {
    h = (r - g) / delta + 4;
  }

  h = Math.round(h * 60);

  // Make negative hues positive behind 360°
  if (h < 0) {
    h += 360;
  }

  // Calculate lightness
  l = (cmax + cmin) / 2;

  // Calculate saturation
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  // Multiply l and s by 100
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return [h, s, l];
}

export function HSLToRGB(h, s, l) {
  // Must be fractions of 1
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return [r, g, b];
}

// convert "rgb(x,y,z)" or "hsl(x,y,z)" to [x, y, z]
export function parseColorString(str) {
  str = str.replace(/(rgb\()|(hsl\()|, |\)/g, substr => substr === ', ' ? ',' : '');

  return str.split(',').map(str => parseInt(str.trim()));
}

// All color/colors here refers to [h,s,l]
const darkContrastedColors = {
  dark:  [0, 0, 100],
  light: [240, 11, 9]
};

const lightContrastedColors = {
  dark:  [240, 11, 9],
  light:  [0, 0, 100],
};

function contrastColor(color, dark = false) {
  let contrastedColors = lightContrastedColors;

  if (dark) {
    contrastedColors = darkContrastedColors;
  }

  return Math.abs(color[2] - contrastedColors.light[2]) > Math.abs(color[2] - contrastedColors.dark[2]) ? contrastedColors.light : contrastedColors.dark;
}

function lighten(color, amount) {
  color[2] = color[2] / (1 - amount);

  return color;
}

function darken(color, amount) {
  const out = [...color];

  out[2] = color[2] * (1 - amount);

  return out;
}

function saturate(color, amount) {

}

/*
 see @/assets/styles/base/_color.scss
Generates primary, active, warning, info etc color variants
*/
function colorStateVariables(colors, dark = false) {
  const classes = [
    'default',
    'text',
    'hover-text',
    'active-text',
    'default',
    'hover-bg',
    'active-bg',
    'border',
    'banner'
  ];
  const out = {};

  for (const key in colors) {
    let colorVars;

    if (!isArray(colors[key])) {
      const map = colors[key];
      const defaultColor = map.default;

      colorVars = {
        [`--${ key }`]:             defaultColor,
        [`--${ key }-text`]:        contrastColor(defaultColor, dark),
        [`--${ key }-hover-bg`]:    darken(defaultColor, 0.1),
        [`--${ key }-active-bg`]:   darken(defaultColor, 0.25),
        [`--${ key }-active-text`]: contrastColor(darken(defaultColor, 0.75), dark),
        [`--${ key }-border`]:      defaultColor,
        [`--${ key }-banner-bg`]:   `hsla(${ defaultColor.join(',') }, 0.15)`
      };

      classes.forEach((str) => {
        if (map[str]) {
          colorVars[`--${ key }-${ str }`] = map[str];
        }
      });
    } else {
      const defaultColor = colors[key];

      colorVars = {
        [`--${ key }`]:             defaultColor,
        [`--${ key }-text`]:        contrastColor(defaultColor, dark),
        [`--${ key }-hover-bg`]:    darken(defaultColor, 0.1),
        [`--${ key }-active-bg`]:   darken(defaultColor, 0.25),
        [`--${ key }-active-text`]: contrastColor(darken(defaultColor, 0.25), dark),
        [`--${ key }-border`]:      defaultColor,
        [`--${ key }-banner-bg`]:   [...defaultColor, 0.15]
      };
    }
    out[key] = colorVars;
  }

  for (const key in out) {
    for (const cssVar in out[key]) {
      const colorArray = out[key][cssVar];

      if (colorArray.length === 4) {
        out[cssVar] = `hsla(${ colorArray[0] }, ${ colorArray[1] }%, ${ colorArray[2] }%, ${ colorArray[3] })`;
      } else {
        out[cssVar] = `hsl(${ colorArray[0] }, ${ colorArray[1] }%, ${ colorArray[2] }%)`;
      }
    }
    delete out[key];
  }

  return out;
}

/*
    see @/assets/styles/base/_light.scss
    css vars referencing $primary in _light:

    $link = $primary
    $selected = rgba($primary, 0.5)

        --accent-btn                 : #{rgba($primary, 0.2)};
        --accent-btn-hover           : #{rgba($primary, 0.5)};
        --card-header                : #{rgba($primary, 0.2)};
        --dropdown-hover-bg          : #{rgba($primary, 0.2)};
        --tooltip-bg                 : #{lighten($primary, 35%)};
        --tag-bg                     : #{rgba($primary, 0.2)};
        --tag-primary                : #{$primary};
        --glance-divider             : #{rgba($primary, 0.5)};

        --dropdown-text              : #{$link};
        --dropdown-active-text       : #{darken($link, 1%)};
        --dropdown-hover-text        : #{lighten($link, 1%)};
        --checkbox-ticked-bg         : #{$link};

        --dropdown-active-bg         : #{$selected};
        --terminal-selection         : #{$selected};
*/
function rootPrimaryColorVariables(primary, dark = false) {
  const out = {
    '--accent-btn':        [...primary, 0.2],
    '--accent-btn-hover':  [...primary, 0.5],
    '--card-header':       [...primary, 0.2],
    '--dropdown-hover-bg': [...primary, 0.2],
    '--tooltip-bg':        lighten(primary, 0.35),
    '--tag-bg':            [...primary, 0.2],
    '--tag-primary':       [...primary],
    '--glance-divider':    [...primary, 0.5],

    '--dropdown-text':        [...primary],
    '--dropdown-active-text': darken(primary, 0.01),
    '--dropdown-hover-text':  lighten(primary, 0.01),
    '--checkbox-ticked-bg':   [...primary],

    '--dropdown-active-bg': [...primary, 0.5],
    '--terminal-selection': [...primary]
  };

  for (const cssVar in out) {
    const colorArray = out[cssVar];

    if (colorArray.length === 4) {
      out[cssVar] = `hsla(${ colorArray[0] }, ${ colorArray[1] }%, ${ colorArray[2] }%, ${ colorArray[3] })`;
    } else {
      out[cssVar] = `hsl(${ colorArray[0] }, ${ colorArray[1] }%, ${ colorArray[2] }%)`;
    }
  }

  return out;
}

export function colorVariables(colors, dark = false) {
  const primaryColor = colors.primary;

  const out = colorStateVariables(colors, dark);

  Object.assign(out, rootPrimaryColorVariables(primaryColor, dark));

  return out;
}
