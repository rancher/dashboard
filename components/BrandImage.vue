<script>
import { MANAGEMENT } from '@/config/types';

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
      const setting = this.managementSettings.filter(setting => setting.id === 'brand')[0] || {};

      return setting.value;
    },

    uiLogoLight() {
      const setting = this.managementSettings.filter(setting => setting.id === 'ui-logo-light')[0] || {};

      return setting.value;
    },

    uiLogoDark() {
      const setting = this.managementSettings.filter(setting => setting.id === 'ui-logo-dark')[0] || {};

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
