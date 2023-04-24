<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'ScaleIO',
  components: {
    Checkbox,
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
    }
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
  computed: {
    storageModeOptions() {
      return [
        { value: 'ThinProvisioned', label: this.t('verrazzano.common.types.scaleIO.storageMode.thin') },
        { value: 'ThickProvisioned', label: this.t('verrazzano.common.types.scaleIO.storageMode.thick') },
      ];
    }
  },
  methods: {
    resetSecrets() {
      if (!this.fetchInProgress) {
        this.secrets = this.allSecrets[this.namespace] || [];
      }
    }
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
      <div class="col span-4">
        <LabeledInput
          :value="getField('gateway')"
          :mode="mode"
          required
          :placeholder="getNotSetPlaceholder(value, 'gateway')"
          :label="t('verrazzano.common.fields.volumes.scaleIO.gateway')"
          @input="setFieldIfNotEmpty('gateway', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('system')"
          :mode="mode"
          required
          :placeholder="getNotSetPlaceholder(value, 'system')"
          :label="t('verrazzano.common.fields.volumes.scaleIO.system')"
          @input="setFieldIfNotEmpty('system', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          :value="getField('secretRef.name')"
          :mode="mode"
          required
          :options="secrets"
          option-label="metadata.name"
          :reduce="secret => secret.metadata.name"
          :placeholder="getNotSetPlaceholder(value, 'secretRef.name')"
          :label="t('verrazzano.common.fields.volumes.scaleIO.secretRefName')"
          @input="setFieldIfNotEmpty('secretRef.name', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('volumeName')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'volumeName')"
          :label="t('verrazzano.common.fields.volumes.scaleIO.volumeName')"
          @input="setFieldIfNotEmpty('volumeName', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          :value="getField('storageMode')"
          :mode="mode"
          :options="storageModeOptions"
          option-key="value"
          option-label="label"
          :placeholder="getNotSetPlaceholder(value, 'storageMode')"
          :label="t('verrazzano.common.fields.volumes.scaleIO.storageMode')"
          @input="setFieldIfNotEmpty('storageMode', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('fsType')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'fsType')"
          :label="t('verrazzano.common.fields.volumes.scaleIO.fsType')"
          @input="setFieldIfNotEmpty('fsType', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div class="row">
      <div class="col span-4">
        <div class="spacer-tiny" />
        <Checkbox
          :value="getField('sslEnabled')"
          :mode="mode"
          :label="t('verrazzano.common.fields.volumes.scaleIO.sslEnabled')"
          @input="setBooleanField('sslEnabled', $event)"
        />
        <div class="spacer-tiny" />
        <Checkbox
          :value="getField('readOnly')"
          :mode="mode"
          :label="t('verrazzano.common.fields.volumes.scaleIO.readOnly')"
          @input="setBooleanField('readOnly', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('protectionDomain')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'protectionDomain')"
          :label="t('verrazzano.common.fields.volumes.scaleIO.protectionDomain')"
          @input="setFieldIfNotEmpty('protectionDomain', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('storagePool')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'storagePool')"
          :label="t('verrazzano.common.fields.volumes.scaleIO.storagePool')"
          @input="setFieldIfNotEmpty('storagePool', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
