<script>
import { MANAGEMENT } from '@/config/types';

export default {
  props:      {
    fileName: {
      type:     String,
      required: true
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
    brandSetting() {
      return this.managementSettings.filter(setting => setting.id === 'brand')[0];
    },

    pathToBrandedImage() {
      let out = require(`~/assets/images/pl/${ this.fileName }`);

      if (!this.brandSetting?.value) {
        return out;
      } else {
        if (this.theme === 'dark') {
          try {
            out = require(`~/assets/brand/${ this.brandSetting.value }/dark/${ this.fileName }`);

            return out;
          } catch {}
        }
        try {
          out = require(`~/assets/brand/${ this.brandSetting.value }/${ this.fileName }`);
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
