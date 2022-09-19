<script>
// Added by Verrazzano
import SimpleBox from '@shell/components/SimpleBox';

import { mapGetters } from 'vuex';
import { allHash } from '@shell/utils/promise';

const VERRAZZANO = 'install.verrazzano.io.Verrazzano';

export default {
  name:       'VerrazzanoLinksBox',
  components: { SimpleBox },
  data() {
    return { links: {} };
  },
  async fetch() {
    const requests = { verrazzanos: this.$store.dispatch('management/findAll', { type: VERRAZZANO }) };

    const hash = await allHash(requests);

    if (hash.verrazzanos) {
      // There should really never be more than one of these so...
      this.links = { ...(hash.verrazzanos[0]?.status?.instance || {}) };

      if ('rancherUrl' in this.links) {
        delete this.links.rancherUrl;
      }
    }
  },
  computed: { ...mapGetters('i18n', ['t']) },
};
</script>

<template>
  <SimpleBox :title="t('verrazzano.links.title')">
    <div v-for="(value, name) in links" :key="name" class="support-link">
      <a v-t="`verrazzano.links.${ name }`" :href="value" target="_blank" rel="noopener noreferrer nofollow" />
    </div>
  </SimpleBox>
</template>

<style lang='scss' scoped>
.support-link:not(:first-child) {
  margin-top: 15px;
}
</style>
