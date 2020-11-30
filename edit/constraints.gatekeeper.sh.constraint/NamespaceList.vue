<script>
import { sortBy } from '@/utils/sort';
import { _EDIT } from '@/config/query-params';
import { NAMESPACE } from '@/config/types';
import LabeledSelect from '@/components/form/LabeledSelect';

export const NAMESPACE_FILTERS = {
  nonSystem(namespace) {
    return !namespace.isSystem;
  }
};

export default {
  components: { LabeledSelect },

  props: {
    value: {
      type:    Array,
      default: null
    },
    mode: {
      type:    String,
      default: _EDIT
    },
    namespaceFilter: {
      type:    Function,
      default: namespace => true
    },
    addLabel: {
      type:    String,
      default: null
    },
    label: {
      type:    String,
      default: 'Namespace'
    },
    tooltip: {
      type:    String,
      default: null
    }
  },

  computed: {
    namespaceOptions() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const choices = this.$store.getters[`${ inStore }/all`](NAMESPACE);

      return sortBy(
        choices
          .filter(this.namespaceFilter)
          .map((obj) => {
            return {
              label: obj.nameDisplay,
              value: obj.id
            };
          }),
        'label'
      );
    }
  }
};
</script>

<template>
  <LabeledSelect
    v-bind="$attrs"
    :value="value"
    :mode="mode"
    :multiple="true"
    :options="namespaceOptions"
    :label="label"
    :tooltip="tooltip"
    :hover-tooltip="!!tooltip"
    @input="(e) => $emit('input', e)"
  />
</template>
