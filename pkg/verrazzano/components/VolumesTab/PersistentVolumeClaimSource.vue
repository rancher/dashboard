<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { PVC } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'PersistentVolumeClaimSource',
  components: {
    Checkbox,
    LabeledSelect,
  },
  mixins: [VerrazzanoHelper],
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
    },
  },
  data() {
    return {
      fetchInProgress: true,
      namespace:       this.namespacedObject.metadata?.namespace,
      allPvcs:         {},
      pvcs:            [],
    };
  },
  async fetch() {
    const requests = { pvcs: this.$store.dispatch('management/findAll', { type: PVC }) };

    const hash = await allHash(requests);

    if (hash.pvcs) {
      this.sortObjectsByNamespace(hash.pvcs, this.allPvcs);
    }
    this.fetchInProgress = false;
  },
  methods: {
    resetPvcs() {
      if (!this.fetchInProgress) {
        this.pvcs = this.allPvcs[this.namespace] || [];
      }
    },
  },
  watch: {
    fetchInProgress() {
      this.resetPvcs();
    },
    'namespacedObject.metadata.namespace'(neu, old) {
      this.namspace = neu;
      this.resetPvcs();
    }
  },
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <LabeledSelect
        :value="getField('claimName')"
        :mode="mode"
        required
        :options="pvcs"
        option-label="metadata.name"
        :reduce="pvc => pvc.metadata.name"
        :placeholder="getNotSetPlaceholder(value, 'claimName')"
        :label="t('verrazzano.common.fields.volumes.pvc.claimName')"
        @input="setFieldIfNotEmpty('claimName', $event)"
      />
    </div>
    <div class="col span-6">
      <Checkbox
        :value="getField('readOnly')"
        :mode="mode"
        :label="t('verrazzano.common.fields.volumes.pvc.readOnly')"
        @input="setBooleanField('readOnly', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
