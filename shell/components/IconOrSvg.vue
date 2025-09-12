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
    color:         '--on-tertiary-header',
    hover:         '--on-tertiary-header-hover',
    colorFallback: '--header-btn-text',
    hoverFallback: '--header-btn-text-hover',
  },
  primary: {
    color:         '--link',
    hover:         '--primary-hover-text',
    colorFallback: '--link',
    hoverFallback: '--primary-hover-text',
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
    imgAlt: {
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
    getComputedStyleFor(cssVar, fallback) {
      const value = window.getComputedStyle(document.body).getPropertyValue(cssVar).trim();

      return normalizeHex(mapStandardColors(value ?? fallback));
    },

    setColor() {
      const colorConfig = colors[this.color];
      const uiColor = this.getComputedStyleFor(colorConfig.color, colorConfig.colorFallback);
      const hoverColor = this.getComputedStyleFor(colorConfig.hover, colorConfig.hoverFallback);

      if (!uiColor || !hoverColor) {
        return;
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
          }
          a.option.active-menu-link > img.${ className } {
            ${ hoverFilter };
          }
        `;

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
    :alt="imgAlt"
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
