<script>
import { MANAGEMENT } from '@/config/types';
import { SETTING } from '@/config/settings';
import isEmpty from 'lodash/isEmpty';

export default {
  props: {
    footer: {
      type:    Boolean,
      default: false
    },
    unauthenticated: {
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

    bannerConsentStyle() {
      const { bannerConsent } = this.banner;

      return {
        color:              bannerConsent.color,
        'background-color': bannerConsent.background,
        'text-align':       bannerConsent.textAlignment,
        'font-weight':      bannerConsent.fontWeight ? 'bold' : '',
        'font-style':       bannerConsent.fontStyle ? 'italic' : '',
        'font-size':        bannerConsent.fontSize,
        'text-decoration':  bannerConsent.textDecoration ? 'underline' : ''
      };
    },

    showBanner() {
      if (!this.banner.text && !this.banner.background) {
        return false;
      }

      return (this.showHeader && !this.footer) || (this.showFooter && this.footer);
    },

    showBannerConsent() {
      if (!this.unauthenticated) {
        return false;
      }

      if (this.showConsent && this.banner.bannerConsent) {
        return (this.showConsent && !this.footer);
      }

      return false;
    }
  },

  watch: {
    bannerSetting(neu) {
      if (neu?.value && neu.value !== '') {
        try {
          const parsed = JSON.parse(neu.value);
          const {
            bannerHeader, bannerFooter, banner, showHeader, showFooter, showConsent
          } = parsed;
          let bannerContent = parsed?.banner || {};

          if (isEmpty(banner)) {
            if (showFooter && this.footer) {
              bannerContent = bannerFooter || {};
            } else if (showHeader) {
              bannerContent = bannerHeader || {};
            } else if (showConsent) {
              bannerContent.bannerConsent = bannerHeader.bannerConsent || {};
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
  <div>
    <div v-if="showBanner" class="banner" :style="bannerStyle">
      {{ banner.text }}
    </div>
    <div v-if="showBannerConsent" class="banner" :style="bannerConsentStyle">
      {{ banner.bannerConsent.text }}
    </div>
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
