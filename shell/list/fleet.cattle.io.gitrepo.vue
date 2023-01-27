<script>
import FleetRepos from '@shell/components/fleet/FleetRepos';
import Masthead from '@shell/components/ResourceList/Masthead';
import { FLEET } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListGitRepo',
  components: {
    FleetRepos,
    Masthead,
  },
  mixins: [ResourceFetch],
  props:  {
    schema: {
      type:     Object,
      required: true,
    },

    resource: {
      type:     String,
      required: true,
    },

    loadIndeterminate: {
      type:    Boolean,
      default: false
    },

    incrementalLoadingIndicator: {
      type:    Boolean,
      default: false
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    this.$initializeFetchData(this.resource);

    this.$fetchType(FLEET.CLUSTER);
    this.$fetchType(FLEET.CLUSTER_GROUP);
    await this.$fetchType(this.resource);
  }
};
</script>

<template>
  <div>
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
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    />
  </div>
</template>
