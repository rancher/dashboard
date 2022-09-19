<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'CephFS',
  components: {
    Checkbox,
    LabeledArrayList,
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
      <div class="col span-6">
        <LabeledInput
          :value="getField('path')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'path')"
          :label="t('verrazzano.common.fields.volumes.cephfs.path')"
          @input="setFieldIfNotEmpty('path', $event)"
        />
      </div>
      <div class="col span-6">
        <Checkbox
          :value="getField('readOnly')"
          :mode="mode"
          :label="t('verrazzano.common.fields.volumes.cephfs.readOnly')"
          @input="setBooleanField('readOnly', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('user')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'user')"
          :label="t('verrazzano.common.fields.volumes.cephfs.user')"
          @input="setFieldIfNotEmpty('user', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          :value="getField('secretRef.name')"
          :mode="mode"
          :options="secrets"
          option-label="metadata.name"
          :reduce="secret => secret.metadata.name"
          :placeholder="getNotSetPlaceholder(value, 'secretRef.name')"
          :label="t('verrazzano.common.fields.volumes.cephfs.secretRefName')"
          @input="setFieldIfNotEmpty('secretRef.name', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('secretFile')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'secretFile')"
          :label="t('verrazzano.common.fields.volumes.cephfs.secretFile')"
          @input="setFieldIfNotEmpty('secretFile', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div>
      <LabeledArrayList
        :value="getListField('monitors')"
        :mode="mode"
        :default-add-value="''"
        :value-label="t('verrazzano.common.fields.volumes.cephfs.monitor')"
        :add-label="t('verrazzano.common.buttons.addCephfsMonitor')"
        @input="setFieldIfNotEmpty('monitors', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
