<script>
import Banner from '@/components/Banner';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';
import Loading from '@/components/Loading';
import MatchExpressions from '@/components/form/MatchExpressions';
import NameNsDescription from '@/components/form/NameNsDescription';

import { set } from '@/utils/object';
import { FLEET } from '@/config/types';
import { convert, matching, simplify } from '@/utils/selector';
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

    if ( !this.value.spec?.selector ) {
      this.value.spec = this.value.spec || {};
      this.value.spec.selector = {
        matchExpressions: [],
        matchLabels:      {},
      };
    }

    this.updateMatchingClusters();
  },

  data() {
    return {
      allClusters:      null,
      matchingClusters: null,
      expressions:      [
        ...convert(this.value.spec.selector.matchLabels || {}),
        ...(this.value.spec.selector.matchExpressions || []),
      ],
    };
  },

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
      const all = this.allClusters;
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
  }
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
    <NameNsDescription v-if="!isView" v-model="value" :mode="mode" :namespaced="isNamespaced" />

    <hr v-if="!isView" class="mt-20 mb-20" />

    <h2 v-t="'fleet.clusterGroup.selector.label'" />
    <MatchExpressions
      :initial-empty-row="!isView"
      :mode="mode"
      type=""
      :value="value.spec.selector.matchExpressions"
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

    <hr class="mt-20" />

    <Labels
      default-section-class="mt-20"
      :value="value"
      :mode="mode"
      :display-side-by-side="false"
    />
  </CruResource>
</template>
