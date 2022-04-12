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
  <nuxt-link v-if="link && link.name" :to="link" class="back-link">
    <i class="icon icon-chevron-left" /> {{ t('generic.back') }}
  </nuxt-link>
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
  }
</style>
