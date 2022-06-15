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

    console.log('MACH. INV. SELECTOR TEMPLATE', this.value);
  },
  data() {
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

    return {
      machineInventories:         null,
      matchingMachineInventories: null,
      expressions
    };
  },
  methods: {
    set,
    matchChanged(expressions) {
      const { matchLabels, matchExpressions } = simplify(expressions);

      set(this, 'expressions', expressions);
      set(this, 'value.spec.template.spec.selector.matchLabels', matchLabels);
      set(this, 'value.spec.template.spec.selector.matchExpressions', matchExpressions);

      console.log('********* matchChanged **********', this.value.spec.template.spec.selector);

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
