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
    @keyup.space="$router.push(link)"
  >
    <span><i class="icon icon-chevron-left" /> {{ t('generic.back') }}</span>
  </router-link>
  <router-link
    v-else
    to="/"
    class="back-link"
    :aria-label="t('nav.home')"
    @keyup.space="$router.push('/')"
  >
    <span><i class="icon icon-chevron-left" /> {{ t('nav.home') }}</span>
  </router-link>
</template>

<style lang="scss" scoped>
  .back-link {
    align-items: center;
    display: flex;
    font-size: 16px;
    margin-bottom: 10px;
    outline: 0;
    padding: 10px 0;
    width: fit-content;

    &:focus-visible span {
      @include focus-outline;
      outline-offset: 4px;
    }
  }
</style>
