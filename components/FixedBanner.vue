<script>
import { MANAGEMENT } from '@/config/types';
import { SETTING } from '@/config/settings';
export default {
  props: {
    footer: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    this.bannerSetting = await this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.BANNERS);
  },

  data() {
    return {
      showHeader:    false,
      showFooter:    false,
      banner:        {},
      bannerSetting: null
    };
  },

  computed: {
    bannerStyle() {
      return {
        color:              this.banner.color,
        'background-color': this.banner.background
      };
    },

    showBanner() {
      if (!this.banner.text && !this.banner.background) {
        return false;
      }

      return (this.showHeader && !this.footer) || (this.showFooter && this.footer);
    }
  },

  watch: {
    bannerSetting(neu) {
      if (neu?.value && neu.value !== '') {
        try {
          const parsed = JSON.parse(neu.value);

          this.showHeader = parsed.showHeader === 'true';

          this.showFooter = parsed.showFooter === 'true';
          this.banner = parsed.banner || {};
        } catch {}
      }
    }
  }
};
</script>

<template>
  <div v-if="showBanner" class="banner" :style="bannerStyle">
    {{ banner.text }}
  </div>
</template>

<style scoped>
    .banner {
        text-align: center;
        line-height: 2em;
        height: 2em;
        width: 100%;
    }
</style>
