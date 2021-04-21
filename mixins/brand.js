import { MANAGEMENT } from '@/config/types';

export default {
  async fetch() {
    this.brandSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'brand' });
  },

  data() {
    return { brandSetting: null };
  },

  head() {
    const theme = this.$store.getters['prefs/theme'];

    let cssClass = `theme-${ theme } overflow-hidden dashboard-body`;

    const brand = this.brandSetting?.value;

    try {
      const brandMeta = require(`~/assets/brand/${ brand }/metadata.json`);

      if (brandMeta.hasStylesheet === 'true') {
        cssClass = `${ cssClass } ${ brand }`;
      } else {
        this.$store.dispatch('prefs/setBrandStyle', theme === 'dark');
      }
    } catch (err) {
    }

    return {
      bodyAttrs: { class: cssClass },
      title:     this.$store.getters['i18n/t']('nav.title'),
    };
  },

};
