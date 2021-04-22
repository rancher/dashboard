import { MANAGEMENT } from '@/config/types';
import { findBy } from '@/utils/array';

export default {
  async fetch() {
    this.globalSettings = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.SETTING });
  },

  data() {
    return { globalSettings: [] };
  },

  computed: {
    brandSetting() {
      return findBy(this.globalSettings, { id: 'brand' });
    }
  },

  watch: {
    brandSetting(neu) {
      const uiPLSetting = findBy(this.globalSettings, { id: 'ui-pl' });
      const brand = neu.value;

      try {
        const brandMeta = require(`~/assets/brand/${ brand }/metadata.json`);
        const uiPL = brandMeta['ui-pl'] || uiPLSetting.default;

        uiPLSetting.value = uiPL;
      } catch {
        uiPLSetting.value = uiPLSetting.default;
      }

      uiPLSetting.save();
    },
  },

  head() {
    const theme = this.$store.getters['prefs/theme'];

    let cssClass = `overflow-hidden dashboard-body`;

    const brand = this.brandSetting?.value;
    let brandMeta;

    try {
      brandMeta = require(`~/assets/brand/${ brand }/metadata.json`);
    } catch {
      return {
        bodyAttrs: { class: `theme-${ theme } ${ cssClass }` },
        title:     this.$store.getters['i18n/t']('nav.title'),
      };
    }

    if (brandMeta?.hasStylesheet === 'true') {
      cssClass = `${ cssClass } ${ brand }-${ theme }`;
    } else {
      cssClass = `theme-${ theme } overflow-hidden dashboard-body`;
      this.$store.dispatch('prefs/setBrandStyle', theme === 'dark');
    }

    return {
      bodyAttrs: { class: cssClass },
      title:     this.$store.getters['i18n/t']('nav.title'),
    };
  },

};
