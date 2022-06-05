<script>
import { _VIEW } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export const SCOPE_OPTIONS = [
  {
    label: 'Cluster & Namespaced',
    value: '*'
  },
  {
    label: 'Cluster',
    value: 'Cluster'
  },
  {
    label: 'Namespaced',
    value: 'Namespaced'
  }
];

export default {
  components: { LabeledSelect },

  props: {
    value: {
      type:    String,
      default: null,
    },
    mode: {
      type:    String,
      default: _VIEW,
    },
  },

  data() {
    return { SCOPE_OPTIONS };
  },
};
</script>

<template>
  <LabeledSelect
    :label="t('gatekeeperConstraint.tab.namespaces.sub.scope.title')"
    :hover-tooltip="true"
    tooltip="Determines if cluster-scoped and/or namespaced-scoped resources are selected."
    :value="value"
    :mode="mode"
    :options="SCOPE_OPTIONS"
    @input="e=>$emit('input', e)"
  />
</template>
