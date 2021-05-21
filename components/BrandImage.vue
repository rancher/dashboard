<script>
import { MANAGEMENT } from '@/config/types';
import { SETTING } from '@/config/settings';

export default {
  props:      {
    fileName: {
      type:     String,
      required: true
    },
    dark: {
      type:    Boolean,
      default: false
    }
  },
  async fetch() {
    this.managementSettings = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.SETTING });
  },
  data() {
    const theme = this.$store.getters['prefs/theme'];

    return { theme, managementSettings: [] };
  },
  computed: {
    brand() {
      const setting = this.managementSettings.filter(setting => setting.id === SETTING.BRAND)[0] || {};

      return setting.value;
    },

    uiLogoLight() {
      const setting = this.managementSettings.filter(setting => setting.id === SETTING.LOGO_LIGHT)[0] || {};

      return setting.value;
    },

    uiLogoDark() {
      const setting = this.managementSettings.filter(setting => setting.id === SETTING.LOGO_DARK)[0] || {};

      return setting.value;
    },

    pathToBrandedImage() {
      let out = require(`~/assets/images/pl/${ this.fileName }`);

      if (this.fileName === 'rancher-logo.svg') {
        if ((this.theme === 'light' || !this.uiLogoDark) && this.uiLogoLight) {
          return this.uiLogoLight;
        } else if (this.uiLogoDark) {
          return this.uiLogoDark;
        }
      }

      if (!this.brand) {
        return out;
      } else {
        if (this.theme === 'dark' || this.dark) {
          try {
            out = require(`~/assets/brand/${ this.brand }/dark/${ this.fileName }`);

            return out;
          } catch {}
        }
        try {
          out = require(`~/assets/brand/${ this.brand }/${ this.fileName }`);
        } catch {
        }

        return out ;
      }
    },

    pathToRancherFallback() {
      return require(`~/assets/images/pl/${ this.fileName }`);
    }
  }
};
</script>
<template>
  <img v-bind="$attrs" :src="pathToBrandedImage" />
</template>
