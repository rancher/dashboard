<script>
import { mapGetters } from 'vuex';
import ResourceTable from '@/components/ResourceTable';
import Masthead from '@/components/ResourceList/Masthead';
import Banner from '@/components/Banner';
import { HIDE_DESC, mapPref } from '@/store/prefs';

export default {
  name:       'ListClisterReposApps',
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
      return this.currentCluster.isLocal ? 'typeDescription."catalog.cattle.io.clusterrepo.local"' : 'typeDescription."catalog.cattle.io.clusterrepo"';
    }
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
