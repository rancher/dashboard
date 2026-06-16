<script>
import Closeable from '@shell/mixins/closeable';
import BrandImage from '@shell/components/BrandImage';
import { getBrandMeta } from '@shell/utils/brand';

export default {
  components: { BrandImage },
  mixins:     [Closeable],

  props: {
    title: {
      type:    String,
      default: null,
    },
    titleKey: {
      type:    String,
      default: null,
    },
  },

  data() {
    const brandMeta = getBrandMeta(this.$store.getters['management/brand']);
    const banner = brandMeta?.banner || {};
    const align = banner.textAlign || 'center';
    const bannerClass = banner.bannerClass || '';

    return { alignClass: `banner-text-${ align }`, bannerClass };
  }
};
</script>

<template>
  <div
    v-if="shown"
    class="banner-graphic-area"
    :class="{[alignClass]: true}"
  >
    <div
      :class="bannerClass"
      class="graphic banner-graphic-height"
    >
      <BrandImage
        class="banner"
        data-testid="banner-brand__img"
        file-name="banner.svg"
        :draggable="false"
        :alt="t('landing.bannerImage')"
      />
    </div>
    <div
      v-if="titleKey"
      data-testid="banner-title-key"
      class="title"
    >
      <t :k="titleKey" />
    </div>
    <h1
      v-else-if="title"
      v-clean-html="title"
      data-testid="banner-title"
      class="title"
    />
  </div>
</template>

<style lang="scss" scoped>
  $banner-height: 200px;

  .banner-graphic-area {
    position: relative;

    .graphic {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      > img.banner {
        flex: 1;
        object-fit: cover;
      }
    }
    .title {
      display: flex;
      align-items: center;
      position: absolute;
      text-align: center;
      top: 0;
      height: 100%;
      width: 100%;
    }

    &.banner-text-center {
      .title {
        justify-content: center;
        margin-top: -20px;
      }
    }

    &.banner-text-left {
      .title {
        justify-content: left;
        padding-left: 20px;
      }
    }
  }

  // Use top-level style so that a theme style can easily override via its own style without having to worry about specificity of CSS styles
  .banner-graphic-height {
    height: var(--banner-graphic-height, $banner-height);
  }
</style>
