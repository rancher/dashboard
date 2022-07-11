<script>
import MatchExpressions from '@shell/components/form/MatchExpressions';
import CreateEditView from '@shell/mixins/create-edit-view';
import { Banner } from '@components/Banner';
import { ELEMENTAL_SCHEMA_IDS } from '@shell/config/elemental-types';
import { set } from '@shell/utils/object';
import { convert, matching, simplify } from '@shell/utils/selector';
import throttle from 'lodash/throttle';

export default {
  components: { MatchExpressions, Banner },
  mixins:     [CreateEditView],
  async fetch() {
    this.machineInventories = await this.$store.dispatch('management/findAll', { type: ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES });
    this.machineInventorySelectorKeyOptions = this.getUniqueLabels(this.machineInventories).map((item) => {
      return {
        label: item,
        value: item
      };
    });
    this.updateMatchingMachineInventories();
  },
  data() {
    if ( !this.value.spec?.template?.spec?.selector ) {
      this.value.spec.template.spec = this.value.spec.template.spec || {};
      this.value.spec.template.spec.selector = {
        matchExpressions: [],
        matchLabels:      {},
      };
    }

    // TODO: this should only run if Elemental is installed... maybe prevent the display of Elemental type in cluster create selection screen if
    // helm chart is not installed
    const prePopulatedClusterElements = this.$store.getters['elemental/createClusterElements'];

    // pre-populate the selectors if we come from the create cluster action on machine inventories list
    if (prePopulatedClusterElements.length) {
      this.value.spec.template.spec.selector.matchExpressions.push({
        key:      'create-cluster-selector',
        operator: 'In',
        values:   [prePopulatedClusterElements[0].metadata.labels['create-cluster-selector']],
      });

      if (!this.value.spec?.template?.spec?.selector?.matchLabels) {
        this.value.spec.template.spec.selector.matchLabels = {};
      }

      this.value.spec.template.spec.selector.matchLabels['create-cluster-selector'] = prePopulatedClusterElements[0].metadata.labels['create-cluster-selector'];

      // cleanup so that it doesn't get reused inadvertedly
      this.$store.dispatch('elemental/updateCreateClusterElements', []);
    }

    const expressions = convert(
      this.value.spec.template.spec.selector.matchLabels || {},
      this.value.spec.template.spec.selector.matchExpressions || []
    );

    return {
      machineInventories:                 null,
      matchingMachineInventories:         null,
      machineInventorySelectorKeyOptions: null,
      expressions
    };
  },
  methods: {
    set,
    getUniqueLabels(arr) {
      const uniqueLabels = [];

      arr.forEach((item) => {
        if (item.metadata?.labels && Object.keys(item.metadata?.labels).length) {
          const objKeys = Object.keys(item.metadata?.labels);

          objKeys.forEach((key) => {
            if (!uniqueLabels.includes(key)) {
              uniqueLabels.push(key);
            }
          });
        }
      });

      return uniqueLabels;
    },
    matchChanged(expressions) {
      const { matchLabels, matchExpressions } = simplify(expressions);

      set(this, 'expressions', expressions);
      set(this, 'value.spec.template.spec.selector.matchLabels', matchLabels);
      set(this, 'value.spec.template.spec.selector.matchExpressions', matchExpressions);

      this.updateMatchingMachineInventories();
    },

    updateMatchingMachineInventories: throttle(function() {
      const all = this.machineInventories;
      const match = matching(all, this.expressions);
      const matched = match.length || 0;
      const sample = match[0]?.nameDisplay;

      this.matchingMachineInventories = {
        matched,
        total:   all.length,
        isAll:   matched === all.length,
        isNone:  matched === 0,
        sample,
      };
    }, 250, { leading: true })
  },
};
</script>

<template>
  <div>
    <h2 v-t="'elemental.clusterGroup.selector.label'" class="mt-20 mb-20" />
    <MatchExpressions
      :mode="mode"
      :value="expressions"
      :show-remove="false"
      :keys-select-options="machineInventorySelectorKeyOptions"
      @input="matchChanged($event)"
    />
    <Banner v-if="matchingMachineInventories" :color="(matchingMachineInventories.isNone || matchingMachineInventories.isAll ? 'warning' : 'success')">
      <span v-if="matchingMachineInventories.isAll" v-html="t('elemental.clusterGroup.selector.matchesAll', matchingMachineInventories)" />
      <span v-else-if="matchingMachineInventories.isNone" v-html="t('elemental.clusterGroup.selector.matchesNone', matchingMachineInventories)" />
      <span
        v-else
        v-html="t('elemental.clusterGroup.selector.matchesSome', matchingMachineInventories)"
      />
    </Banner>
  </div>
</template>
