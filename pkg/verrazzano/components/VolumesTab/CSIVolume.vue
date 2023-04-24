<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import KeyValue from '@shell/components/form/KeyValue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'CSIVolume',
  components: {
    Checkbox,
    KeyValue,
    LabeledInput,
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
      allSecrets:      {},
      secrets:         []
    };
  },
  async fetch() {
    const requests = { secrets: this.$store.dispatch('management/findAll', { type: SECRET }) };

    const hash = await allHash(requests);

    if (hash.secrets) {
      this.sortObjectsByNamespace(hash.secrets, this.allSecrets);
    }
    this.fetchInProgress = false;
  },
  methods: {
    resetSecrets() {
      if (!this.fetchInProgress) {
        this.secrets = this.allSecrets[this.namespace] || [];
      }
    },
  },
  watch: {
    fetchInProgress() {
      this.resetSecrets();
    },
    'namespacedObject.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetSecrets();
    }
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-3">
        <LabeledInput
          :value="getField('driver')"
          :mode="mode"
          required
          :placeholder="getNotSetPlaceholder(value, 'driver')"
          :label="t('verrazzano.common.fields.volumes.csi.driver')"
          @input="setFieldIfNotEmpty('driver', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          :value="getField('fsType')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'fsType')"
          :label="t('verrazzano.common.fields.volumes.csi.fsType')"
          @input="setFieldIfNotEmpty('fsType', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          :value="getField('nodePublishSecretRef.name')"
          :mode="mode"
          :options="secrets"
          option-label="metadata.name"
          :reduce="secret => secret.metadata.name"
          :placeholder="getNotSetPlaceholder(value, 'nodePublishSecretRef.name')"
          :label="t('verrazzano.common.fields.volumes.csi.nodePublishSecretName')"
          @input="setFieldIfNotEmpty('nodePublishSecretRef.name', $event)"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :value="getField('readOnly')"
          :mode="mode"
          :label="t('verrazzano.common.fields.volumes.csi.readOnly')"
          @input="setBooleanField('readOnly', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div>
      <h4>{{ t('verrazzano.common.titles.volumes.csiVolumeAttributes') }}</h4>
      <KeyValue
        :value="getField('volumeAttributes')"
        :mode="mode"
        :add-label="t('verrazzano.common.buttons.addVolumeAttribute')"
        :read-allowed="false"
        @input="setFieldIfNotEmpty('volumeAttributes', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
