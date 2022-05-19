<script>
import { mapGetters } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import Banner from '@shell/components/Banner';
import { HIDE_DESC, mapPref } from '@shell/store/prefs';
import { addObject } from '@shell/utils/array';

export default {
  name:       'ListClusterReposApps',
  components: {
    Banner,
    Masthead,
    ResourceTable
  },

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },
  },

  computed: {
    ...mapGetters(['currentCluster']),
    hideDescriptions: mapPref(HIDE_DESC),

    typeDescriptionKey() {
      // Show a different message to cover support for RKE templates in the local cluster
      // (no current cluster means catalog requests default to local)
      const key = !this.currentCluster || this.currentCluster.isLocal ? 'typeDescription."catalog.cattle.io.clusterrepo.local"' : 'typeDescription."catalog.cattle.io.clusterrepo"';

      if ( this.hideDescriptions.includes(this.resource) || this.hideDescriptions.includes('ALL') ) {
        return false;
      }

      if ( this.$store.getters['i18n/exists'](key) ) {
        return key;
      }

      return false;
    }
  },

  methods: {
    hideTypeDescription() {
      const neu = this.hideDescriptions.slice();

      addObject(neu, this.resource);

      this.hideDescriptions = neu;
    },
  }
};
</script>

<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
    >
      <template #typeDescription>
        <Banner
          v-if="typeDescriptionKey"
          class="type-banner mb-20 mt-0"
          color="info"
          :closable="true"
          :label-key="typeDescriptionKey"
          @close="hideTypeDescription"
        />
      </template>
    </Masthead>

    <ResourceTable
      :schema="schema"
      :rows="rows"
    />
  </div>
</template>
