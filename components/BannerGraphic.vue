<script>
export default {
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
  <div class="banner-graphic" :class="{'small': small}">
    <div class="graphic">
      <img class="top" src="~/assets/images/pl/decoration-cloud-big-white.svg" />
      <img class="trees" src="~/assets/images/pl/decoration-ground.svg" />
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
  .banner-graphic {
    background-color: #f2f5f5;
    position: relative;

    .graphic {
      display: flex;
      flex-direction: column;
      height: 240px;
      overflow: hidden;
      > img {
        object-fit: cover;
        width: 100%;
        height: 200px;

        &.top {
          height: 60px;
          width: 100%;
          margin: 0;
        }
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
        height: 200px;
        img.top {
          position: absolute;
        }
        img.trees {
          padding-top: 10px;
          z-index: 1;
        }
      }
      .title {
        top: 50px;
      }
    }
  }
</style>
