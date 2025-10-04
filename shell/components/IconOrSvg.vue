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
    color:          '--on-tertiary-header',
    hover:          '--on-tertiary-header-hover',
    colorFallback:  '--header-btn-text',
    hoverFallback:  '--header-btn-text-hover',
    active:         '--on-tertiary-header-hover',
    activeFallback: '--header-btn-text-hover',
  },
  primary: {
    color:          '--link',
    hover:          '--link',
    colorFallback:  '--link',
    hoverFallback:  '--primary-hover-text',
    active:         '--on-active',
    activeFallback: '--primary-hover-text',
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

    resolveColorFilter(cacheKey, rgb) {
      if (filterCache[cacheKey]) {
        return filterCache[cacheKey];
      }

      const solver = new Solver(rgb);
      const res = solver.solve();
      const filter = res?.filter;

      filterCache[cacheKey] = filter;

      return filter;
    },

    setColor() {
      const colorConfig = colors[this.color];
      const uiColor = this.getComputedStyleFor(colorConfig.color, colorConfig.colorFallback);
      const hoverColor = this.getComputedStyleFor(colorConfig.hover, colorConfig.hoverFallback);
      const activeColor = this.getComputedStyleFor(colorConfig.active, colorConfig.activeFallback);

      if (!uiColor || !hoverColor || !activeColor) {
        return;
      }

      const uiColorRGB = colorToRgb(uiColor);
      const hoverColorRGB = colorToRgb(hoverColor);
      const activeColorRGB = colorToRgb(activeColor);
      const uiColorStr = `${ uiColorRGB.r }-${ uiColorRGB.g }-${ uiColorRGB.b }`;
      const hoverColorStr = `${ hoverColorRGB.r }-${ hoverColorRGB.g }-${ hoverColorRGB.b }`;

      const className = `svg-icon-${ uiColorStr }-${ hoverColorStr }`;

      if (!cssCache[className]) {
        const hoverFilter = this.resolveColorFilter(hoverColor, hoverColorRGB);
        const mainFilter = this.resolveColorFilter(uiColor, uiColorRGB);
        const activeFilter = this.resolveColorFilter(activeColor, activeColorRGB);

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
            ${ activeFilter };
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
