<script>

/**
 * This component renders the icon in the top level menu.
 * Icon can either be via a font via the 'icon' property or an svg via the 'src' property
 *
 * The trickiness here is that we want the icon to be the correct color - both normally and when hovered
 * For a font icon, this is easy, since we just set the color css property
 * For an svg icon included with the <img> tag this is harder - there is no way to apply css to
 * the svg brought in this way - the workaround is to apply a css filter - in order to do this we
 * need to generate the css filter for the required color - the code for that is in the 'svg-filter' utility
 *
 * We cache filters and css for given colors, so we only generate them once.
 *
 * This makes the code here look complex - but we are essentially generating the css filters
 * and then injecting custom css into the document so that any icons included via svg will
 * show with the desired colors for the theme.
 */
import { Solver } from '@shell/utils/svg-filter';
import { colorToRgb, mapStandardColors, normalizeHex } from '@shell/utils/color';

const filterCache = {};
const cssCache = {};

const colors = {
  header: {
    color: '--header-btn-text',
    hover: '--header-btn-text-hover'
  },
  primary: {
    color: '--link',
    hover: '--primary-hover-text'
  }
};

export default {
  name:  'IconOrSvg',
  props: {
    src: {
      type:    String,
      default: () => undefined,
    },
    icon: {
      type:    String,
      default: () => undefined,
    },
    color: {
      type:    String,
      default: () => 'primary',
    }
  },

  data() {
    return { className: '' };
  },

  created() {
    if (this.src) {
      this.setColor();
    }
  },

  methods: {
    setColor() {
      const currTheme = this.$store.getters['prefs/theme'];
      let uiColor, hoverColor;

      // grab css vars values based on the actual stylesheets, depending on the theme applied
      // use for loops to minimize computation
      for (let i = 0; i < Object.keys(document.styleSheets).length; i++) {
        let found = false;
        const stylesheet = document.styleSheets[i];

        if (stylesheet && stylesheet.cssRules) {
          for (let x = 0; x < Object.keys(stylesheet.cssRules).length; x++) {
            const cssRules = stylesheet.cssRules[x];

            if (cssRules.selectorText && ((currTheme === 'light' && (cssRules.selectorText.includes('body') || cssRules.selectorText.includes('BODY')) &&
              cssRules.selectorText.includes('.theme-light') && cssRules.style.cssText.includes('--link:')) ||
              (currTheme === 'dark' && cssRules.selectorText.includes('.theme-dark')))) {
              // grab the colors to be used on the icon from the css rules
              uiColor = mapStandardColors(cssRules.style.getPropertyValue(colors[this.color].color).trim());
              hoverColor = mapStandardColors(cssRules.style.getPropertyValue(colors[this.color].hover).trim());

              // normalize hex colors (#xxx to #xxxxxx)
              uiColor = normalizeHex(uiColor);
              hoverColor = normalizeHex(hoverColor);

              found = true;
              break;
            }
          }
        }
        if (found) {
          break;
        } else {
          continue;
        }
      }

      const uiColorRGB = colorToRgb(uiColor);
      const hoverColorRGB = colorToRgb(hoverColor);
      const uiColorStr = `${ uiColorRGB.r }-${ uiColorRGB.g }-${ uiColorRGB.b }`;
      const hoverColorStr = `${ hoverColorRGB.r }-${ hoverColorRGB.g }-${ hoverColorRGB.b }`;

      const className = `svg-icon-${ uiColorStr }-${ hoverColorStr }`;

      if (!cssCache[className]) {
        let hoverFilter = filterCache[hoverColor];

        if (!hoverFilter) {
          const solver = new Solver(hoverColorRGB);
          const res = solver.solve();

          hoverFilter = res?.filter;
          filterCache[hoverColor] = hoverFilter;
        }

        let mainFilter = filterCache[uiColor];

        if (!mainFilter) {
          const solver = new Solver(uiColorRGB);
          const res = solver.solve();

          mainFilter = res?.filter;
          filterCache[uiColor] = mainFilter;
        }

        // Add stylesheet (added as global styles)
        const styles = `
          img.${ className } {
            ${ mainFilter };
          }
          img.${ className }:hover {
            ${ hoverFilter };
          }
          button:hover > img.${ className } {
            ${ hoverFilter };
          }
          li:hover > img.${ className } {
            ${ hoverFilter };
          }
          a.option:hover > img.${ className } {
            ${ hoverFilter };
          }      `;

        const styleSheet = document.createElement('style');

        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        cssCache[className] = true;
      }

      this['className'] = className;
    }
  }
};
</script>

<template>
  <img
    v-if="src"
    :src="src"
    class="svg-icon"
    :class="className"
  >
  <i
    v-else-if="icon"
    class="icon group-icon"
    :class="icon"
  />
  <i
    v-else
    class="icon icon-extension"
  />
</template>

<style lang="scss" scoped>
  .svg-icon {
    height: 24px;
    width: 24px;
  }
</style>
