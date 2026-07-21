<script>
import { Banner } from '@components/Banner';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Labels from '@shell/components/form/Labels';
import Loading from '@shell/components/Loading';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import NameNsDescription from '@shell/components/form/NameNsDescription';

import { set } from '@shell/utils/object';
import { FLEET } from '@shell/config/types';
import { convert, matching, simplify } from '@shell/utils/selector';
import throttle from 'lodash/throttle';
import { allHash } from '@shell/utils/promise';

export default {
  name: 'CruClusterGroup',

  emits: ['input'],

  inheritAttrs: false,
  components:   {
    Banner,
    CruResource,
    Labels,
    Loading,
    MatchExpressions,
    NameNsDescription,
  },

  mixins: [CreateEditView],

  async fetch() {
    const _hash = {};

    if (this.$store.getters['management/schemaFor'](FLEET.WORKSPACE)) {
      _hash.allWorkspaces = this.$store.dispatch('management/findAll', { type: FLEET.WORKSPACE });
    }

    const hash = await allHash(_hash);

    this.allWorkspaces = hash.allWorkspaces || [];

    // The "matches N of M clusters" preview only looks at the selected workspace's clusters
    // (clustersForWorkspace -> workspace.clusters), so load just that namespace's clusters rather
    // than every cluster. Re-fetched when the workspace changes (see the namespace watcher).
    await this.fetchClustersForWorkspace();

    if ( !this.value.spec?.selector ) {
      this.value.spec = this.value.spec || {};
      this.value.spec.selector = {
        matchExpressions: [],
        matchLabels:      {},
      };
    }

    const expressions = convert(
      this.value.spec.selector.matchLabels || {},
      this.value.spec.selector.matchExpressions || []
    );

    this.matchChanged(expressions);
  },

  data() {
    return {
      allWorkspaces:    null,
      matchingClusters: null,
      expressions:      null,
    };
  },

  computed: {
    FLEET_WORKSPACE() {
      return FLEET.WORKSPACE;
    },

    clustersForWorkspace() {
      const namespace = this.value.metadata?.namespace;

      if ( !namespace ) {
        return [];
      }

      const workspace = this.$store.getters['management/byId'](FLEET.WORKSPACE, namespace);

      if ( workspace ) {
        return workspace.clusters;
      }

      return [];
    },
  },

  watch: { 'value.metadata.namespace': 'workspaceChanged' },

  methods: {
    set,

    /**
     * Load only the selected workspace's clusters (the preview is scoped to that workspace) instead
     * of every cluster. Populates the store that `workspace.clusters` (clustersForWorkspace) reads.
     */
    async fetchClustersForWorkspace() {
      const namespace = this.value.metadata?.namespace;

      if ( namespace && this.$store.getters['management/schemaFor'](FLEET.CLUSTER) ) {
        await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER, opt: { namespaced: namespace } });
      }
    },

    async workspaceChanged() {
      await this.fetchClustersForWorkspace();
      this.updateMatchingClusters();
    },

    matchChanged(expressions) {
      const { matchLabels, matchExpressions } = simplify(expressions);

      set(this, 'expressions', expressions);
      set(this, 'value.spec.selector.matchLabels', matchLabels);
      set(this, 'value.spec.selector.matchExpressions', matchExpressions);

      this.updateMatchingClusters();
    },

    updateMatchingClusters: throttle(function() {
      const all = this.clustersForWorkspace;
      const match = matching(all, this.expressions);
      const matched = match.length || 0;
      const sample = match[0]?.nameDisplay;

      this.matchingClusters = {
        matched,
        total:  all.length,
        isAll:  matched === all.length,
        isNone: matched === 0,
        sample,
      };
    }, 250, { leading: true }),
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :mode="mode"
      :namespaced="false"
      namespace-label="nameNsDescription.workspace.label"
      :namespace-type="FLEET_WORKSPACE"
      @update:value="$emit('input', $event)"
    />
    <MatchExpressions
      :mode="mode"
      :value="expressions"
      :show-remove="false"
      @update:value="matchChanged($event)"
    >
      <template #header>
        <h2 v-t="'fleet.clusterGroup.selector.label'" />
      </template>
    </MatchExpressions>
    <Banner
      v-if="matchingClusters"
      :color="(matchingClusters.isNone || matchingClusters.isAll ? 'warning' : 'success')"
    >
      <span
        v-if="matchingClusters.isAll"
        v-clean-html="t('fleet.clusterGroup.selector.matchesAll', matchingClusters)"
      />
      <span
        v-else-if="matchingClusters.isNone"
        v-clean-html="t('fleet.clusterGroup.selector.matchesNone', matchingClusters)"
      />
      <span
        v-else
        v-clean-html="t('fleet.clusterGroup.selector.matchesSome', matchingClusters)"
      />
    </Banner>

    <div class="spacer" />

    <Labels
      default-section-class="mt-20"
      :value="value"
      :mode="mode"
      :display-side-by-side="false"
    />
  </CruResource>
</template>
