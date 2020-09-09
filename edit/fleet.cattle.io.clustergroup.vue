<script>
import CreateEditView from '@/mixins/create-edit-view';
import Banner from '@/components/Banner';
import Footer from '@/components/form/Footer';
import Labels from '@/components/form/Labels';
import Loading from '@/components/Loading';
import MatchExpressions from '@/components/form/MatchExpressions';
import NameNsDescription from '@/components/form/NameNsDescription';

import { set } from '@/utils/object';
import { FLEET } from '@/config/types';
import { matching } from '@/utils/selector';
import throttle from 'lodash/throttle';

export default {
  name: 'CruClusterGroup',

  components: {
    Banner,
    Footer,
    Labels,
    Loading,
    MatchExpressions,
    NameNsDescription,
  },

  mixins: [CreateEditView],

  async fetch() {
    this.allClusters = await this.$store.dispatch('cluster/findAll', { type: FLEET.CLUSTER });
    this.updateMatchingClusters();
  },

  data() {
    return {
      allClusters:      null,
      matchingClusters: null,
      expressions:      null,
    };
  },

  computed: {},

  methods: {
    set,

    matchChanged(expressions) {
      set(this.value.spec.selector, 'matchExpressions', expressions);
      this.updateMatchingClusters();
    },

    updateMatchingClusters: throttle(function() {
      const all = this.allClusters;
      const match = matching(all, this.value.spec.selector.matchExpressions);
      const count = match.length || 0;
      const sample = match[0]?.nameDisplay;

      this.matchingClusters = {
        isAll:  count === all.length,
        isNone: count === 0,
        others: count - 1,
        sample,
      };
    }, 250, { leading: true }),
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <form v-else>
    <NameNsDescription v-model="value" :mode="mode" :namespaced="isNamespaced" />

    <hr class="mt-20 mb-20" />

    <h2>Select clusters which match the labels</h2>
    <MatchExpressions
      :initial-empty-row="!isView"
      :mode="mode"
      type=""
      :value="value.spec.selector.matchExpressions"
      :show-remove="false"
      @input="matchChanged(e)"
    />
    <Banner v-if="matchingClusters" :color="(matchingClusters ? 'info' : 'warning')">
      <span v-if="matchingClusters.isAll" v-t="'fleet.clusterGroup.selector.matchesAll'" />
      <span v-else-if="matchingClusters.isNone" v-t="'fleet.clusterGroup.selector.matchesNone'" />
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

    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </form>
</template>
