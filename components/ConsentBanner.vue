<script>
import { MANAGEMENT } from '@/config/types';
import { SETTING } from '@/config/settings';
import { isEmpty } from '@/utils/object';

export default {
  async fetch() {
    this.bannerSetting = await this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.BANNERS);
  },

  data() {
    return {
      showConsent:    false,
      banner:        {},
      bannerSetting:  null
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

      return (this.showConsent);
    }
  },

  watch: {
    bannerSetting(neu) {
      if (neu?.value && neu.value !== '') {
        try {
          const parsed = JSON.parse(neu.value);
          const { consentBanner, showConsent, banner } = parsed;
          let bannerContent = parsed?.consentBanner || {};

          if (isEmpty(banner)) {
            bannerContent = consentBanner || {};
          }

          this.showConsent = showConsent === 'true';
          this.banner = bannerContent;
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
    text-align: left;
    line-height: 2em;
    height: auto;
    width: 100%;
    padding: 0 20px;
  }
</style>
