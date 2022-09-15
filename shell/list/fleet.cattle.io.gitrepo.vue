<script>
import FleetRepos from '@shell/components/fleet/FleetRepos';
import Masthead from '@shell/components/ResourceList/Masthead';
import Loading from '@shell/components/Loading';
import { FLEET } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListGitRepo',
  components: {
    Loading,
    FleetRepos,
    Masthead,
  },
  mixins:     [ResourceFetch],
  props:  {
    schema: {
      type:     Object,
      required: true,
    },

    resource: {
      type:     String,
      required: true,
    },

    loadResources: {
      type:    Array,
      default: () => []
    },

    loadIndeterminate: {
      type:    Boolean,
      default: false
    },

    incrementalLoadingIndicator: {
      type:    Boolean,
      default: false
    },
  },

  async fetch() {
    const store = this.$store;

    await store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    await store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP });

    this.rows = await this.$fetchType(this.resource);
  },

  data() {
    return { rows: null };
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="resource"
      :show-incremental-loading-indicator="incrementalLoadingIndicator"
      :load-resources="loadResources"
      :load-indeterminate="loadIndeterminate"
      :create-button-label="t('fleet.gitRepo.repo.addRepo')"
    />
    <FleetRepos
      :rows="rows"
      :schema="schema"
    />
  </div>
</template>
