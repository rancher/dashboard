<script>
import { MANAGEMENT } from '@/config/types';
import { SETTING } from '@/config/settings';
import isEmpty from 'lodash/isEmpty';

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
      showHeader:      false,
      showFooter:      false,
      banner:          {},
      bannerSetting:   null
    };
  },

  computed: {
    bannerStyle() {
      return {
        color:              this.banner.color,
        'background-color': this.banner.background,
        'text-align':       this.banner.textAlignment,
        'font-weight':      this.banner.fontWeight ? 'bold' : '',
        'font-style':       this.banner.fontStyle ? 'italic' : '',
        'text-decoration':  this.banner.textDecoration ? 'underline' : ''
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
          const {
            bannerHeader, bannerFooter, banner, showHeader, showFooter
          } = parsed;
          let bannerContent = parsed?.banner || {};

          if (isEmpty(banner)) {
            if (showFooter && this.footer) {
              bannerContent = bannerFooter || {};
            } else if (showHeader) {
              bannerContent = bannerHeader || {};
            } else {
              bannerContent = {};
            }
          }

          this.showHeader = showHeader === 'true';
          this.showFooter = showFooter === 'true';
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
        text-align: center;
        line-height: 2em;
        height: 2em;
        width: 100%;
        padding: 0 20px;
    }
</style>
