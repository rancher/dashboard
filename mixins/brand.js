import { MANAGEMENT } from '@/config/types';
import { getVendor } from '@/config/private-label';
import { SETTING } from '@/config/settings';
import { findBy } from '@/utils/array';
import { createCssVars } from '@/utils/color';

export default {
  async fetch() {
    this.globalSettings = await this.$store.getters['management/all'](MANAGEMENT.SETTING);
    console.debug(this.globalSettings);
  },

  data() {
    return { globalSettings: [], brandCookie: null };
  },

  computed: {
    brand() {
      const setting = findBy(this.globalSettings, 'id', SETTING.BRAND);

      return setting?.value;
    },

    color() {
      const setting = findBy(this.globalSettings, 'id', SETTING.PRIMARY_COLOR);

      console.debug('COLOR', setting);

      return setting?.value;
    },

    linkColor() {
      const setting = findBy(this.globalSettings, 'id', SETTING.LINK_COLOR);

      console.debug('LINK COLOR', setting);

      return setting?.value;
    },

    theme() {
      return this.$store.getters['prefs/theme'];
    }
  },

  watch: {
    color(neu) {
      if (neu) {
        this.setCustomPrimaryColor(neu);
      } else {
        this.removePrimaryCustomColor();
      }
    },
    linkColor(neu) {
      if (neu) {
        console.debug('SETTING LINK COLOR');
        this.setCustomLinkColor(neu);
      } else {
        this.removeCustomLinkColor();
      }
    },
    theme() {
      if (this.color) {
        this.setCustomPrimaryColor(this.color);
      }
      if (this.linkColor) {
        this.setCustomLinkColor(this.linkColor);
      }
    },
  },
  methods: {
    setCustomPrimaryColor(color) {
      const vars = createCssVars(color, this.theme);

      for (const prop in vars) {
        document.body.style.setProperty(prop, vars[prop]);
      }
    },

    removePrimaryCustomColor() {
      const vars = createCssVars('rgb(0,0,0)', this.theme);

      for (const prop in vars) {
        document.body.style.removeProperty(prop);
      }
    },

    setCustomLinkColor(color) {
      console.debug('SET LINK COLOR');
      const vars = createCssVars(color, this.theme, 'link');

      console.debug('~~~~~', vars, color, this.theme);

      for (const prop in vars) {
        document.body.style.setProperty(prop, vars[prop]);
      }
    },

    removeCustomLinkColor() {
      const vars = createCssVars('rgb(0,0,0)', this.theme);

      for (const prop in vars) {
        document.body.style.removeProperty(prop);
      }
    }
  },
  head() {
    let cssClass = `overflow-hidden dashboard-body`;

    let brandMeta;

    try {
      brandMeta = require(`~/assets/brand/${ this.brand }/metadata.json`);
    } catch {
      return {
        bodyAttrs: { class: `theme-${ this.theme } ${ cssClass }` },
        title:     getVendor(),
      };
    }

    if (brandMeta?.hasStylesheet === 'true') {
      cssClass = `${ cssClass } ${ this.brand } theme-${ this.theme }`;
    } else {
      cssClass = `theme-${ this.theme } overflow-hidden dashboard-body`;
      this.$store.dispatch('prefs/setBrandStyle', this.theme === 'dark');
    }

    return {
      bodyAttrs: { class: cssClass },
      title:     getVendor(),
    };
  },

};
