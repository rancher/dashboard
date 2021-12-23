<script>
import isEmpty from 'lodash/isEmpty';
import { MANAGEMENT } from '@/config/types';
import { SETTING } from '@/config/settings';

export default {
  props: {
    header: {
      type:    Boolean,
      default: false
    },
    consent: {
      type:    Boolean,
      default: false
    },
    footer: {
      type:    Boolean,
      default: false
    },
  },

  async fetch() {
    this.bannerSetting = await this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.BANNERS);
  },

  data() {
    return {
      showHeader:      false,
      showFooter:      false,
      showConsent:     false,
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
        'font-size':        this.banner.fontSize,
        'text-decoration':  this.banner.textDecoration ? 'underline' : ''
      };
    },

    showBanner() {
      if (!this.banner.text && !this.banner.background) {
        return false;
      }

      if (this.header) {
        return this.showHeader;
      } else if (this.consent) {
        return this.showConsent;
      } else if (this.footer) {
        return this.showFooter;
      }

      return null;
    }
  },

  watch: {
    bannerSetting(neu) {
      if (neu?.value && neu.value !== '') {
        try {
          const parsed = JSON.parse(neu.value);
          const {
            bannerHeader, bannerFooter, bannerConsent, banner, showHeader, showFooter, showConsent
          } = parsed;
          let bannerContent = parsed?.banner || {};

          if (isEmpty(banner)) {
            if (showHeader && this.header) {
              bannerContent = bannerHeader || {};
            } else if (showConsent && this.consent) {
              bannerContent = bannerConsent || {};
            } else if (showFooter && this.footer) {
              bannerContent = bannerFooter || {};
            } else {
              bannerContent = {};
            }
          }

          this.showHeader = showHeader === 'true';
          this.showFooter = showFooter === 'true';
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
        text-align: center;
        line-height: 2em;
        height: 2em;
        width: 100%;
        padding: 0 20px;
    }
</style>
