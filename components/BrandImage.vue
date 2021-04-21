<script>
import LazyImage from '@/components/LazyImage';
import { MANAGEMENT } from '@/config/types';
export default {
  components: { LazyImage },
  props:      {
    fileName: {
      type:     String,
      required: true
    }
  },
  async fetch() {
    this.brandSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'brand' });
  },
  data() {
    return { brandSetting: null };
  },
  computed: {
    pathToBrandedImage() {
      let out = require(`~/assets/images/pl/${ this.fileName }`);

      if (!this.brandSetting?.value) {
        return out;
      } else {
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
  <LazyImage v-bind="$attrs" :initial-src="pathToBrandedImage" :src="pathToBrandedImage" :error-src="pathToRancherFallback" />
</template>
