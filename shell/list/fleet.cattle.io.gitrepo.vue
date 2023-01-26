<script>
import FleetRepos from '@shell/components/fleet/FleetRepos';
import Masthead from '@shell/components/ResourceList/Masthead';
import { FLEET } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';

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
    const hash = await checkSchemasForFindAllHash({
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
      },

      workspaces: {
        inStoreType: 'management',
        type:        FLEET.WORKSPACE
      },

    }, this.$store);

    this.hasWorkspaces = !!hash.workspaces.length;

    await this.$fetchType(this.resource);
  },

  data() {
    const formRoute = {
      name:   `c-cluster-product-resource`,
      params: {
        resource: FLEET.WORKSPACE,
      }
    };

    return { hasWorkspaces: false, formRoute };
  },
};
</script>

<template>
  <div v-if="hasWorkspaces">
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
  <div v-else>
    <div class="intro-box">
      <i class="icon icon-repository" />
      <div class="title">
        <span v-html="t('fleet.gitRepo.repo.noWorkspaces', null, true)" />
      </div>
      <div class="actions">
        <n-link
          :to="formRoute"
          class="btn role-secondary"
        >
          {{ t('fleet.gitRepo.workspace.addWorkspace') }}
        </n-link>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.intro-box {
  flex: 0 0 100%;
  height: calc(100vh - 246px); // 2(48 content header + 20 padding + 55 pageheader)
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.title {
  margin-bottom: 15px;
  font-size: $font-size-h2;
  text-align: center;
  max-width: 600px;
}
.icon-repository {
  font-size: 96px;
  margin-bottom: 32px;
}
</style>
