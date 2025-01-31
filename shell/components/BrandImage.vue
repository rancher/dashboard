<script>
import { mapGetters } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { getSettingValue } from '@shell/utils/settings';
import { RegistrationType } from '@shell/core/types';

export default {
  props: {
    fileName: {
      type:     String,
      required: true
    },
    dark: {
      type:    Boolean,
      default: false
    },
    supportCustomLogo: {
      type:    Boolean,
      default: false
    }
  },
  data() {
    const managementSettings = this.$store.getters['management/all'](MANAGEMENT.SETTING);

    const uiLoginBackgroundLight = managementSettings?.filter((setting) => setting.id === SETTING.LOGIN_BACKGROUND_LIGHT)?.[0]?.value;
    const uiLoginBackgroundDark = managementSettings?.filter((setting) => setting.id === SETTING.LOGIN_BACKGROUND_DARK)?.[0]?.value;

    return {
      managementSettings,

      /**
       * Login settings fields don't require reactivity; the correct value for those fields is the initial one.
       * This will avoid side effects after the management store is reset when landing on login page.
       */
      uiLoginBackgroundLight,
      uiLoginBackgroundDark,
    };
  },
  computed: {
    ...mapGetters({ theme: 'prefs/theme' }),

    brand() {
      const setting = this.managementSettings.filter((setting) => setting.id === SETTING.BRAND)[0] || {};

      return getSettingValue(setting, this.$plugin);
    },

    uiLogoLight() {
      const setting = this.managementSettings.filter((setting) => setting.id === SETTING.LOGO_LIGHT)[0] || {};

      return setting.value;
    },

    uiLogoDark() {
      const setting = this.managementSettings.filter((setting) => setting.id === SETTING.LOGO_DARK)[0] || {};

      return setting.value;
    },

    uiBannerLight() {
      const setting = this.managementSettings.filter((setting) => setting.id === SETTING.BANNER_LIGHT)[0] || {};

      return setting.value;
    },

    uiBannerDark() {
      const setting = this.managementSettings.filter((setting) => setting.id === SETTING.BANNER_DARK)[0] || {};

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

    // Used when we look up images from extensions - we do this without the file extension
    fileNameWithoutExtension() {
      return this.fileName.split('.').slice(0, -1).join('.');
    },

    pathToBrandedImage() {
      if (this.fileName === 'rancher-logo.svg' || this.supportCustomLogo) {
        if (this.theme === 'dark' && this.uiLogoDark) {
          return this.uiLogoDark;
        }

        if (this.uiLogoLight) {
          return this.uiLogoLight;
        }
      }

      if (this.fileName === 'banner.svg') {
        if (this.theme === 'dark' && this.uiBannerDark) {
          return this.uiBannerDark;
        }

        if (this.uiBannerLight) {
          return this.uiBannerLight;
        }
      }

      if (this.fileName === 'login-landscape.svg') {
        if (this.theme === 'dark' && this.uiLoginBackgroundDark) {
          return this.uiLoginBackgroundDark;
        }

        if (this.uiLoginBackgroundLight) {
          return this.uiLoginBackgroundLight;
        }
      }

      if (!this.brand) {
        return this.defaultPathToBrandedImage;
      } else {
        if (this.theme === 'dark' || this.dark) {
          const file = this.$plugin.getDynamic(RegistrationType.IMAGE, `brand/${ this.brand }/dark/${ this.fileNameWithoutExtension }`);

          if (file) {
            return file;
          }

          try {
            return require(`~shell/assets/brand/${ this.brand }/dark/${ this.fileName }`);
          } catch {}
        }
        try {
          const file = this.$plugin.getDynamic(RegistrationType.IMAGE, `brand/${ this.brand }/${ this.fileNameWithoutExtension }`);

          if (file) {
            return file;
          }

          return require(`~shell/assets/brand/${ this.brand }/${ this.fileName }`);
        } catch {}

        return this.defaultPathToBrandedImage;
      }
    },
  }
};
</script>
<template>
  <img
    v-bind="$attrs"
    :src="pathToBrandedImage"
  >
</template>
