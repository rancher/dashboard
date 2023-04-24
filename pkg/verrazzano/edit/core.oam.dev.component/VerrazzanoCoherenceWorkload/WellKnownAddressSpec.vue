<script>
// Added by Verrazzano
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import { NAMESPACE } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'WellKnownAddressSpec',
  components: {
    LabeledInput,
    LabeledSelect,
  },
  mixins: [CoherenceWorkloadHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
    }
  },
  data() {
    return { allNamespaces: [] };
  },
  async fetch() {
    const requests = { namespaces: this.$store.dispatch('management/findAll', { type: NAMESPACE }) };

    const hash = await allHash(requests);

    this.allNamespaces = hash.namespaces;
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-4">
      <LabeledInput
        :value="getField('deployment')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'deployment')"
        :label="t('verrazzano.coherence.fields.wkaDeployment')"
        @input="setFieldIfNotEmpty('deployment', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledSelect
        :value="getField('namespace')"
        :mode="mode"
        :options="allNamespaces"
        option-label="metadata.name"
        :reduce="namespace => namespace.metadata.name"
        :placeholder="getNotSetPlaceholder(value, 'namespace')"
        :label="t('verrazzano.common.fields.namespace')"
        @input="setFieldIfNotEmpty('namespace', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
