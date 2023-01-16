<script>
import { mapGetters } from 'vuex';
import { Banner } from '@components/Banner';
import { HIDE_DESC, mapPref } from '@shell/store/prefs';
import { addObject } from '@shell/utils/array';
import { CATALOG } from '@shell/config/types';

export default {
  components: { Banner },

  props: {
    resource: {
      type:     String,
      required: true
    },
  },

  computed: {
    ...mapGetters(['currentCluster']),
    hideDescriptions: mapPref(HIDE_DESC),

    typeDescriptionKey() {
      let key;

      if (this.resource === CATALOG.CLUSTER_REPO) {
        key = !this.currentCluster || this.currentCluster.isLocal ? 'typeDescription."catalog.cattle.io.clusterrepo.local"' : 'typeDescription."catalog.cattle.io.clusterrepo"';
      } else {
        key = `typeDescription."${ this.resource }"`;
      }

      if ( this.hideDescriptions.includes(this.resource) || this.hideDescriptions.includes('ALL') ) {
        return false;
      }

      if ( this.$store.getters['i18n/exists'](key) ) {
        return key;
      }

      return false;
    },
  },

  methods: {
    hideTypeDescription() {
      const neu = this.hideDescriptions.slice();

      addObject(neu, this.resource);

      this.hideDescriptions = neu;
    },
  },
};
</script>

<template>
  <Banner
    v-if="typeDescriptionKey"
    class="type-banner mb-20 mt-0"
    color="info"
    :closable="true"
    :label-key="typeDescriptionKey"
    @close="hideTypeDescription"
  />
</template>
