<script>
import { SCHEMA, FLEET } from '@shell/config/types';
import { checkPermissions, checkSchemasForFindAllHash } from '@shell/utils/auth';
import Masthead from '@shell/components/ResourceList/Masthead';
import FleetNoWorkspaces from '@shell/components/fleet/FleetNoWorkspaces.vue';
import FleetApplications from '@shell/components/fleet/FleetApplications';

const schema = {
  id:   FLEET.APPLICATION,
  type: SCHEMA,
};

export default {
  name:       'ListApplications',
  components: {
    Masthead,
    FleetNoWorkspaces,
    FleetApplications,
  },

  props: {
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
    try {
      const hash = await checkSchemasForFindAllHash({
        cluster: {
          inStoreType: 'management',
          type:        FLEET.CLUSTER
        },

        clusterGroups: {
          inStoreType: 'management',
          type:        FLEET.CLUSTER_GROUP
        },

        gitRepos: {
          inStoreType: 'management',
          type:        FLEET.GIT_REPO
        },

        helmOps: {
          inStoreType: 'management',
          type:        FLEET.HELM_OP
        },

        workspaces: {
          inStoreType: 'management',
          type:        FLEET.WORKSPACE
        },

      }, this.$store);

      this.hasWorkspaces = (hash.workspaces || []).length > 0;
    } catch (e) {
    }

    try {
      const permissions = await checkPermissions(
        {
          workspaces: { type: FLEET.WORKSPACE },
          gitRepos:   { type: FLEET.GIT_REPO },
          helmOps:    { type: FLEET.HELM_OP }
        },
        this.$store.getters
      );

      this.permissions = permissions;
    } catch (e) {
    }
  },

  data() {
    // TODO show warning if 1 of the {gitrepo, helmOps} has no permission

    return {
      schema,
      hasWorkspaces:             false,
      permissions:               {},
      createLocation:            { name: 'c-cluster-fleet-application-create' },
      forceUpdateLiveAndDelayed: 10
    };
  },

  computed: {
    rows() {
      return [
        ...this.$store.getters[`management/all`](FLEET.GIT_REPO),
        ...this.$store.getters[`management/all`](FLEET.HELM_OP)
      ];
    },
  },

  methods: {}
};
</script>

<template>
  <div v-if="hasWorkspaces">
    <Masthead
      :schema="schema"
      :resource="schema.id"
      :type-display="t('fleet.application.pageTitle')"
    >
      <template #createButton>
        <router-link
          :to="createLocation"
          class="btn role-primary"
        >
          {{ t('fleet.application.actions.create') }}
        </router-link>
      </template>
    </Masthead>
    <FleetApplications
      :rows="rows"
      :schema="schema"
      :loading="$fetchState.pending"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    />
  </div>
  <div v-else>
    <FleetNoWorkspaces :can-view="permissions.workspaces" />
  </div>
</template>
