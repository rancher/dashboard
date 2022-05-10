<script>
import Banner from '@shell/components/Banner';
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

export default {
  name: 'CruClusterGroup',

  components: {
    Banner,
    CruResource,
    Labels,
    Loading,
    MatchExpressions,
    NameNsDescription,
  },

  mixins: [CreateEditView],

  async fetch() {
    this.allClusters = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    this.allWorkspaces = await this.$store.dispatch('management/findAll', { type: FLEET.WORKSPACE });

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
      allClusters:      null,
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

  watch: { 'value.metadata.namespace': 'updateMatchingClusters' },

  methods: {
    set,

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
        total:   all.length,
        isAll:   matched === all.length,
        isNone:  matched === 0,
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
      v-model="value"
      :mode="mode"
      :namespaced="false"
      namespace-label="nameNsDescription.workspace.label"
      :namespace-type="FLEET_WORKSPACE"
    />

    <h2 v-t="'fleet.clusterGroup.selector.label'" />
    <MatchExpressions
      :mode="mode"
      :value="expressions"
      :show-remove="false"
      @input="matchChanged($event)"
    />
    <Banner v-if="matchingClusters" :color="(matchingClusters.isNone || matchingClusters.isAll ? 'warning' : 'success')">
      <span v-if="matchingClusters.isAll" v-html="t('fleet.clusterGroup.selector.matchesAll', matchingClusters)" />
      <span v-else-if="matchingClusters.isNone" v-html="t('fleet.clusterGroup.selector.matchesNone', matchingClusters)" />
      <span
        v-else
        v-html="t('fleet.clusterGroup.selector.matchesSome', matchingClusters)"
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
