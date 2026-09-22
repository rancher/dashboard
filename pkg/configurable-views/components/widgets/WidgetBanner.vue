<script>
import BannerGraphic from '@shell/components/BannerGraphic.vue';
import { getVendor } from '@shell/config/private-label';

// Welcome banner widget (JSON template building block). By DEFAULT it renders the exact stock
// BannerGraphic (brand image + title). Provide `image` to use your own background image, and
// `subtitle` for a second line.
//
// Widget spec:
//   { type: 'banner', title: 'Welcome to Rancher' }                         // stock brand banner
//   { type: 'banner', titleKey: 'landing.welcomeToRancher' }                 // title via i18n key
//   { type: 'banner', title: 'My Home', subtitle: '…', image: 'https://…' }  // custom image banner
export default {
  name:       'WidgetBanner',
  components: { BannerGraphic },

  props: {
    widget: {
      type:    Object,
      default: () => ({}),
    },
  },

  computed: {
    bgStyle() {
      return this.widget.image ? { backgroundImage: `url('${ this.widget.image }')` } : {};
    },

    // With no title of its own the banner falls back to Rancher's own welcome line — the same
    // string the stock Home shows, vendor and all — so dropping a banner on the grid gives you the
    // real thing rather than an untitled picture.
    title() {
      if (this.widget.title) {
        return this.widget.title;
      }

      return this.widget.titleKey ? null : this.$store.getters['i18n/t']('landing.welcomeToRancher', { vendor: getVendor() });
    },
  },
};
</script>

<template>
  <!-- Custom-image banner when `image` is set… -->
  <div
    v-if="widget.image"
    class="wb"
    :style="bgStyle"
  >
    <div class="wb__text">
      <h1 class="wb__title">
        {{ title || 'Welcome' }}
      </h1>
      <p
        v-if="widget.subtitle"
        class="wb__subtitle"
      >
        {{ widget.subtitle }}
      </p>
    </div>
  </div>

  <!-- …otherwise the exact stock Home banner. -->
  <BannerGraphic
    v-else
    :title="title"
    :title-key="widget.titleKey || null"
  />
</template>

<style lang="scss" scoped>
.wb {
  align-items:         center;
  background-position: center;
  background-size:     cover;
  border-radius:       var(--border-radius);
  color:               white;
  display:             flex;
  min-height:          160px;
  overflow:            hidden;
  padding:             24px 28px;
  position:            relative;

  // Legibility scrim so the title reads over any image.
  &::before {
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.1));
    content:    '';
    inset:      0;
    position:   absolute;
  }

  &__text {
    position: relative;
    z-index:  1;
  }

  &__title {
    margin:      0;
    font-size:   28px;
    line-height: 1.1;
  }

  &__subtitle {
    margin:    8px 0 0;
    font-size: 15px;
    opacity:   0.9;
  }
}
</style>
