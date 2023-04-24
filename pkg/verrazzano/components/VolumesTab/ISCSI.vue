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
  name:       'ISCSI',
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
    },
  },
  data() {
    return {
      fetchInProgress: true,
      namespace:       this.namespacedObject.metadata?.namespace,
      allSecrets:      {},
      secrets:         [],
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
      <div class="col span-4">
        <LabeledInput
          :value="getField('iqn')"
          :mode="mode"
          required
          :placeholder="getNotSetPlaceholder(value, 'iqn')"
          :label="t('verrazzano.common.fields.volumes.iscsi.iqn')"
          @input="setFieldIfNotEmpty('iqn', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('lun')"
          :mode="mode"
          required
          type="Number"
          min="0"
          :placeholder="getNotSetPlaceholder(value, 'lun')"
          :label="t('verrazzano.common.fields.volumes.iscsi.lun')"
          @input="setNumberField('lun', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('targetPortal')"
          :mode="mode"
          required
          :placeholder="getNotSetPlaceholder(value, 'targetPortal')"
          :label="t('verrazzano.common.fields.volumes.iscsi.targetPortal')"
          @input="setFieldIfNotEmpty('targetPortal', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('iscsiInterface')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'iscsiInterface')"
          :label="t('verrazzano.common.fields.volumes.iscsi.iscsiInterface')"
          @input="setFieldIfNotEmpty('iscsiInterface', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('fsType')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'fsType')"
          :label="t('verrazzano.common.fields.volumes.iscsi.fsType')"
          @input="setFieldIfNotEmpty('fsType', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('initiatorName')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'initiatorName')"
          :label="t('verrazzano.common.fields.volumes.iscsi.initiatorName')"
          @input="setFieldIfNotEmpty('initiatorName', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div class="row">
      <div class="col span-4">
        <div class="spacer-tiny" />
        <Checkbox
          :value="getField('chapAuthDiscovery')"
          :mode="mode"
          :label="t('verrazzano.common.fields.volumes.iscsi.chapAuthDiscovery')"
          @input="setBooleanField('chapAuthDiscovery', $event)"
        />
        <div class="spacer-tiny" />
        <Checkbox
          :value="getField('chapAuthSession')"
          :mode="mode"
          :label="t('verrazzano.common.fields.volumes.iscsi.chapAuthSession')"
          @input="setBooleanField('chapAuthSession', $event)"
        />
      </div>
      <div class="col span-4">
        <div class="spacer-tiny" />
        <Checkbox
          :value="getField('readOnly')"
          :mode="mode"
          :label="t('verrazzano.common.fields.volumes.iscsi.readOnly')"
          @input="setBooleanField('readOnly', $event)"
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
          :label="t('verrazzano.common.fields.volumes.iscsi.secretRefName')"
          @input="setFieldIfNotEmpty('secretRef.name', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div>
      <LabeledArrayList
        :value="getListField('portals')"
        :mode="mode"
        :value-label="t('verrazzano.common.fields.volumes.iscsi.portal')"
        :add-label="t('verrazzano.common.buttons.addTargetPortal')"
        @input="setFieldIfNotEmpty('portals', $event)"
      />
    </div>
  </div>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
