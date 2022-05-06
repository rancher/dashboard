<script>
import { mapGetters } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

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
    this.managementSettings = await this.$store.getters['management/all'](MANAGEMENT.SETTING);
  },
  data() {
    return { managementSettings: [] };
  },
  computed: {
    ...mapGetters({ theme: 'prefs/theme' }),

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

    defaultPathToBrandedImage() {
      const themePrefix = this.theme === 'dark' ? 'dark/' : '';

      try {
        return require(`~shell/assets/images/pl/${ themePrefix }${ this.fileName }`);
      } catch {
        return require(`~shell/assets/images/pl/${ this.fileName }`);
      }
    },

    pathToBrandedImage() {
      if (this.fileName === 'rancher-logo.svg') {
        if (this.theme === 'dark' && this.uiLogoDark) {
          return this.uiLogoDark;
        }

        if (this.uiLogoLight) {
          return this.uiLogoLight;
        }
      }

      if (!this.brand) {
        return this.defaultPathToBrandedImage;
      } else {
        if (this.theme === 'dark' || this.dark) {
          try {
            return require(`~shell/assets/brand/${ this.brand }/dark/${ this.fileName }`);
          } catch {}
        }
        try {
          return require(`~shell/assets/brand/${ this.brand }/${ this.fileName }`);
        } catch {}

        return this.defaultPathToBrandedImage;
      }
    },
  }
};
</script>
<template>
  <img v-bind="$attrs" :src="pathToBrandedImage" />
</template>
