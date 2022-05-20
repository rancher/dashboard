import { MANAGEMENT } from '@shell/config/types';
import { getVendor } from '@shell/config/private-label';
import { SETTING } from '@shell/config/settings';
import { findBy } from '@shell/utils/array';
import { createCssVars } from '@shell/utils/color';

export default {
  async fetch() {
    this.globalSettings = await this.$store.getters['management/all'](MANAGEMENT.SETTING);
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

      return setting?.value;
    },

    linkColor() {
      const setting = findBy(this.globalSettings, 'id', SETTING.LINK_COLOR);

      return setting?.value;
    },

    theme() {
      return this.$store.getters['prefs/theme'];
    }
  },

  watch: {
    color(neu) {
      if (neu) {
        this.setCustomColor(neu);
      } else {
        this.removeCustomColor();
      }
    },
    linkColor(neu) {
      if (neu) {
        this.setCustomColor(neu, 'link');
      } else {
        this.removeCustomColor('link');
      }
    },
    theme() {
      if (this.color) {
        this.setCustomColor(this.color);
      }
      if (this.linkColor) {
        this.setCustomColor(this.linkColor, 'link');
      }
    },
  },
  methods: {
    setCustomColor(color, name = 'primary') {
      const vars = createCssVars(color, this.theme, name);

      for (const prop in vars) {
        document.body.style.setProperty(prop, vars[prop]);
      }
    },

    removeCustomColor(name = 'primary') {
      const vars = createCssVars('rgb(0,0,0)', this.theme, name);

      for (const prop in vars) {
        document.body.style.removeProperty(prop);
      }
    }
  },
  head() {
    let cssClass = `overflow-hidden dashboard-body`;
    const out = {
      bodyAttrs: { class: `theme-${ this.theme } ${ cssClass }` },
      title:     getVendor(),
    };

    if (getVendor() === 'Harvester') {
      const ico = require(`~shell/assets/images/pl/harvester.png`);

      out.title = 'Harvester';
      out.link = [{
        hid:  'icon',
        rel:  'icon',
        type: 'image/x-icon',
        href: ico
      }];
    }

    let brandMeta;

    if ( this.brand ) {
      try {
        brandMeta = require(`~shell/assets/brand/${ this.brand }/metadata.json`);
      } catch {
        return out;
      }
    }

    if (brandMeta?.hasStylesheet === 'true') {
      cssClass = `${ cssClass } ${ this.brand } theme-${ this.theme }`;
    } else {
      cssClass = `theme-${ this.theme } overflow-hidden dashboard-body`;
      this.$store.dispatch('prefs/setBrandStyle', this.theme === 'dark');
    }

    out.bodyAttrs.class = cssClass;

    return out;
  },

};
