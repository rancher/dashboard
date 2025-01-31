<script>
export default {
  props: {
    link: {
      type:    Object,
      default: null,
    },
  }
};
</script>
<template>
  <router-link
    v-if="link && link.name"
    :to="link"
    class="back-link"
    role="link"
    :aria-label="t('generic.back')"
  >
    <i class="icon icon-chevron-left" /> {{ t('generic.back') }}
  </router-link>
  <router-link
    v-else
    to="/"
    class="back-link"
    :aria-label="t('nav.home')"
  >
    <i class="icon icon-chevron-left" /> {{ t('nav.home') }}
  </router-link>
</template>

<style lang="scss" scoped>
  .back-link {
    align-items: center;
    display: flex;
    font-size: 16px;
    margin: 10px 0 20px 0;
    outline: 0;
    width: fit-content;

    &:focus-visible {
      @include focus-outline;
    }
  }
</style>
