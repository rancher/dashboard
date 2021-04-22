<script>
import { options } from '@/config/footer';
import SimpleBox from '@/components/SimpleBox';
import Closeable from '@/mixins/closeable';

export default {
  components: { SimpleBox },

  mixins: [Closeable],

  computed: {
    pl() {
      // @TODO PL support
      return 'rancher';
    },

    options() {
      return options(this.pl);
    },
  }
};
</script>

<template>
  <SimpleBox :title="t('landing.community.title')" :pref="pref" :pref-key="prefKey">
    <div v-for="(value, name) in options" :key="name" class="support-link">
      <a v-t="name" :href="value" target="_blank" rel="noopener noreferrer nofollow" />
    </div>
  </SimpleBox>
</template>

<style lang='scss' scoped>
  .support-link:not(:first-child) {
    margin-top: 15px;
  }
</style>
