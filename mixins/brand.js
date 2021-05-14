import { MANAGEMENT } from '@/config/types';
import { findBy } from '@/utils/array';
import { getVendor } from '@/config/private-label';

export default {
  async fetch() {
    this.brandCookie = this.$cookies.get('brand');
    try {
      this.globalSettings = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.SETTING });
    } catch {}
  },

  data() {
    return { globalSettings: [], brandCookie: null };
  },

  computed: {
    brand() {
      if (this.brandCookie && !this.globalSettings.length) {
        return this.brandCookie;
      }

      return findBy(this.globalSettings, { id: 'brand' })?.value;
    }
  },

  head() {
    const theme = this.$store.getters['prefs/theme'];

    let cssClass = `overflow-hidden dashboard-body`;

    let brandMeta;

    try {
      brandMeta = require(`~/assets/brand/${ this.brand }/metadata.json`);
    } catch {
      return {
        bodyAttrs: { class: `theme-${ theme } ${ cssClass }` },
        title:     getVendor(),
      };
    }

    if (brandMeta?.hasStylesheet === 'true') {
      cssClass = `${ cssClass } ${ this.brand } theme-${ theme }`;
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
