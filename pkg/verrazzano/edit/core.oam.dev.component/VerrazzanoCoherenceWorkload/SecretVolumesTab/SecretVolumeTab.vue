<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import Checkbox from '@components/Form/Checkbox/Checkbox';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SecretItem from '@pkg/components/VolumesTab/Secret/SecretItem';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

import { SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'SecretVolumeTab',
  components: {
    ArrayListGrouped,
    Checkbox,
    LabeledInput,
    LabeledSelect,
    SecretItem,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [CoherenceWorkloadHelper, DynamicListHelper],
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
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      fetchInProgress: true,
      isLoading:       true,
      treeTabName:     this.tabName,
      treeTabLabel:    this.tabLabel,
      namespace:       this.namespacedObject.metadata.namespace,
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
    getDynamicListRootFieldName() {
      return 'items';
    },
    getSecret() {
      const name = this.getField('name');

      return !this.fetchInProgress && name ? this.secrets.find(secret => secret.metadata.name === name) : {};
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.value.volumeName || this.value.name;
    }
  },
  mounted() {
    this.isLoading = false;
  },
  watch: {
    fetchInProgress() {
      this.resetSecrets();
    },
    'namespacedObject.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetSecrets();
    },
    'value.volumeName'(neu, old) {
      if (!this.fetchInProgress) {
        if (neu) {
          this.treeTabLabel = neu;
        } else if (old === this.treeTabLabel) {
          this.treeTabLabel = this.value.name;
        }
      }
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="$emit('delete', value)"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-4">
          <Checkbox
            :value="getField('readOnly')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.secretVolume.readOnly')"
            @input="setBooleanField('readOnly', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('optional')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.secretVolume.optional')"
            @input="setBooleanField('optional', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledSelect
            :value="getField('name')"
            :mode="mode"
            required
            disabled
            :options="secrets"
            option-label="metadata.name"
            :reduce="secret => secret.metadata.name"
            :placeholder="getNotSetPlaceholder(value, 'name')"
            :label="t('verrazzano.coherence.fields.secretVolume.name')"
            @input="setFieldIfNotEmpty('name', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('mountPath')"
            :mode="mode"
            required
            :placeholder="getNotSetPlaceholder(value, 'mountPath')"
            :label="t('verrazzano.coherence.fields.secretVolume.mountPath')"
            @input="setFieldIfNotEmpty('mountPath', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('volumeName')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'volumeName')"
            :label="t('verrazzano.coherence.fields.secretVolume.volumeName')"
            @input="setFieldIfNotEmpty('volumeName', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('subPath')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'subPath')"
            :label="t('verrazzano.coherence.fields.secretVolume.subPath')"
            @input="setFieldIfNotEmpty('subPath', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('subPathExpr')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'subPathExpr')"
            :label="t('verrazzano.coherence.fields.secretVolume.subPathExpr')"
            @input="setFieldIfNotEmpty('subPathExpr', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            :value="getField('mountPropagation')"
            :mode="mode"
            :options="mountPropagationModeOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'mountPropagation')"
            :label="t('verrazzano.common.fields.mountPropagationMode')"
            @input="setFieldIfNotEmpty('mountPropagation', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('defaultMode')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'defaultMode')"
            :label="t('verrazzano.coherence.fields.secretVolume.defaultMode')"
            @input="setFieldIfNotEmpty('defaultMode', $event)"
          />
        </div>
      </div>
      <div class="spacer" />
      <div>
        <h3>{{ t('verrazzano.coherence.titles.secretItems') }}</h3>
        <ArrayListGrouped
          :value="dynamicListChildren"
          :mode="mode"
          :default-add-value="{ }"
          :add-label="t('verrazzano.common.buttons.addSecretItem')"
          @add="dynamicListAddChild()"
        >
          <template #remove-button="removeProps">
            <button
              v-if="dynamicListShowRemoveButton"
              type="button"
              class="btn role-link close btn-sm"
              @click="dynamicListDeleteChildByIndex(removeProps.i)"
            >
              <i class="icon icon-2x icon-x" />
            </button>
            <span v-else />
          </template>
          <template #default="props">
            <div class="spacer-small" />
            <SecretItem
              :value="props.row.value"
              :mode="mode"
              :secret="getSecret()"
              @input="dynamicListUpdate"
            />
          </template>
        </ArrayListGrouped>
      </div>
    </template>
  </TreeTab>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
