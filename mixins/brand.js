import { MANAGEMENT } from '@/config/types';
import { getVendor } from '@/config/private-label';
import { SETTING } from '@/config/settings';

export default {
  fetch() {
    this.brandCookie = this.$cookies.get('brand');
  },

  data() {
    return { globalSettings: [], brandCookie: null };
  },

  computed: {
    brand() {
      const setting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.BRAND);

      if ( this.brandCookie && !setting ) {
        return this.brandCookie;
      }

      return setting?.value;
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
