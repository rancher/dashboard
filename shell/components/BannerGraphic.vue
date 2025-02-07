<script>
import Closeable from '@shell/mixins/closeable';
import BrandImage from '@shell/components/BrandImage';

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

    small: {
      type:    Boolean,
      default: false
    }
  },
};
</script>

<template>
  <div
    v-if="shown"
    class="banner-graphic"
    :class="{'small': small}"
  >
    <div class="graphic">
      <BrandImage
        class="banner"
        data-testid="banner-brand__img"
        file-name="banner.svg"
        :draggable="false"
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

<style lang="scss">
  $banner-height: 240px;
  $banner-height-small: 200px;

  .banner-graphic {
    position: relative;

    .graphic {
      display: flex;
      flex-direction: column;
      height: $banner-height;
      overflow: hidden;
      > img.banner {
        flex: 1;
        object-fit: cover;
      }
    }
    .title {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      text-align: center;
      top: 0;
      height: 100%;
      width: 100%;
      margin-top: -20px;
    }
    &.small {
      .graphic {
        height: $banner-height-small;
        img.banner {
          margin-top: math.div(($banner-height-small - $banner-height), 2);
        }
      }
    }
  }
</style>
