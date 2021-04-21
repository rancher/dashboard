<script>
import Closeable from '@/mixins/closeable';

export default {
  mixins: [Closeable],

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
  <div v-if="shown" class="banner-graphic" :class="{'small': small}">
    <div v-if="pref" class="close-button" @click="hide()">
      <i class="icon icon-close" />
    </div>
    <div class="graphic">
      <img class="banner" src="~/assets/images/pl/banner.svg" />
    </div>
    <div v-if="titleKey" class="title">
      <t :k="titleKey" />
    </div>
    <h1 v-else-if="title" class="title">
      {{ title }}
    </h1>
  </div>
</template>

<style lang="scss">
  $banner-height: 240px;
  $banner-height-small: 200px;

  .banner-graphic {
    position: relative;

    .close-button {
      position: absolute;
      visibility: hidden;
    }

    &:hover .close-button {
      visibility: visible;
      position: absolute;
      right: 4px;
      top: 4px;
      font-size: 16px;
      padding: 4px;
      display: flex;
      align-items: center;
      cursor: pointer;
      opacity: 0.4;

      &:hover {
        background-color: var(--accent-btn-hover);
        opacity: 1;
      }
    }

    .graphic {
      display: flex;
      flex-direction: column;
      height: $banner-height;
      overflow: hidden;
      > img.banner {
        object-fit: cover;
        width: 100%;
        height: $banner-height;
      }
    }
    .title {
      position: absolute;
      text-align: center;
      top: 70px;
      width: 100%;
    }
    &.small {
      .graphic {
        height: $banner-height-small;
        img.banner {
          margin-top: ($banner-height-small - $banner-height)/2;
        }
      }
      .title {
        top: 50px;
      }
    }
  }
</style>
