<script>
import FleetRepos from '@shell/components/fleet/FleetRepos';
import Masthead from '@shell/components/ResourceList/Masthead';
import { FLEET } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { checkSchemasForFindAllHash } from '~/shell/utils/auth';

export default {
  name:       'ListGitRepo',
  components: {
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
    await checkSchemasForFindAllHash({
      cluster: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER
      },
      clusterGroups: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER_GROUP
      },

      // Not sure why I need this here
      gitRepos: {
        inStoreType: 'management',
        type:        FLEET.GIT_REPO
      }

    }, this.$store);

    // fixes getter error await store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    //  await store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP });

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
    />
  </div>
</template>
