<!--<script>
import { Banner } from '@components/Banner';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import { convert, matching, simplify } from '@shell/utils/selector';
import { ELEMENTAL_SCHEMA_IDS } from '@pkg/elemental/types';

export default {
  components: { Banner, MatchExpressions },
  async fetch() {
    this.machineInventories = await this.$store.dispatch('management/findAll', { type: ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES });

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
      machineInventories:      null,
      matchingClusters:   null,
      expressions:        null,
    };
  },
};
</script>

<template>
  <div>
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
  </div>
</template>

<style lang="scss" scoped>

</style>-->

<script>
import MatchExpressions from '@shell/components/form/MatchExpressions';
import CreateEditView from '@shell/mixins/create-edit-view';
import { Banner } from '@components/Banner';
import { ELEMENTAL_SCHEMA_IDS } from '@pkg/elemental/types';
import { set } from '@shell/utils/object';
import { convert, matching, simplify } from '@shell/utils/selector';

export default {
  components: { MatchExpressions, Banner },
  mixins:     [CreateEditView],
  async fetch() {
    this.machineInventories = await this.$store.dispatch('management/findAll', { type: ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES });

    if ( !this.value.spec?.template?.spec?.selector ) {
      this.value.spec.template.spec = this.value.spec.template.spec || {};
      this.value.spec.template.spec.selector = {
        matchExpressions: [],
        matchLabels:      {},
      };
    }

    const expressions = convert(
      this.value.spec.template.spec.selector.matchLabels || {},
      this.value.spec.template.spec.selector.matchExpressions || []
    );

    this.matchChanged(expressions);
  },
  data() {
    return {
      machineInventories:         null,
      matchingMachineInventories: null,
      // expressions:        null,
    };
  },
  methods: {
    set,
    matchChanged(expressions) {
      const { matchLabels, matchExpressions } = simplify(expressions);

      set(this, 'expressions', expressions);
      set(this, 'value.spec.template.spec.selector.matchLabels', matchLabels);
      set(this, 'value.spec.template.spec.selector.matchExpressions', matchExpressions);

      // this.updateMatchingClusters();
    },
  },
};
</script>

<template>
  <div>
    <h3 class="mt-20 mb-20">
      Machine Inventory Selector
    </h3>
    <MatchExpressions
      :mode="mode"
      :value="expressions"
      :show-remove="false"
      @input="matchChanged($event)"
    />
  </div>
</template>

<style lang="scss" scoped>

</style>
