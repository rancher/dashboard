<script>
// Added by Verrazzano
import KeyValue from '@shell/components/form/KeyValue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabelsTab from '@pkg/components/LabelsTab';
import OamComponentHelper from '@pkg/mixins/oam-component-helper';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import TreeTabbed from '@pkg/components/TreeTabbed';

import { asciiLike } from '@shell/utils/string';
import { base64Encode, base64Decode } from '@shell/utils/crypto';

export default {
  name:       'ConfigMap',
  components: {
    KeyValue,
    LabeledInput,
    LabelsTab,
    TreeTab,
    TreeTabbed,
  },
  mixins: [OamComponentHelper],
  props:  {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
  data() {
    const existingBinaryData = this.getWorkloadField('binaryData') || {};
    const data = this.getWorkloadField('data') || {};
    const decodedBinaryData = {};

    Object.keys(existingBinaryData).forEach((key) => {
      decodedBinaryData[key] = base64Decode(existingBinaryData[key]);
    });

    return { allData: { ...decodedBinaryData, ...data } };
  },
  methods:  {
    initSpec() {
      this.setField('spec', {
        workload: {
          apiVersion: this.configMapApiVersion,
          kind:       'ConfigMap',
          metadata:   { namespace: this.value.metadata.namespace },
        }
      });
    },
    isBinary(value) {
      return typeof value === 'string' && !asciiLike(value);
    },
  },
  created() {
    if (!this.value.spec?.workload) {
      this.initSpec();
    }
  },
  watch: {
    'metadata.namespace'(neu, old) {
      if (neu) {
        this.setWorkloadFieldIfNotEmpty('metadata.namespace', neu);
      }
    },
    allData(neu, old) {
      const data = {};
      const binaryData = {};

      Object.keys(neu).forEach((key) => {
        if (this.isBinary(neu[key])) {
          binaryData[key] = base64Encode(neu[key]);
        } else {
          data[key] = neu[key];
        }
      });

      this.setWorkloadFieldIfNotEmpty('binaryData', binaryData);
      this.setWorkloadFieldIfNotEmpty('data', data);
    }
  },
};
</script>

<template>
  <TreeTabbed>
    <template #nestedTabs>
      <TreeTab name="data" :label="t('configmap.tabs.data.label')">
        <template #default>
          <div class="row">
            <div class="col span-6">
              <LabeledInput
                :value="getWorkloadField('metadata.name')"
                :mode="mode"
                required
                :placeholder="getWorkloadMetadataNotSetPlaceholder('name')"
                :label="t('verrazzano.common.fields.workloadConfigMapName')"
                @input="setWorkloadMetadataFieldIfNotEmpty('name', $event)"
              />
            </div>
          </div>
          <div class="spacer-small" />
          <KeyValue
            key="data"
            v-model="allData"
            :mode="mode"
            :protip="t('configmap.tabs.data.protip')"
            :initial-empty-row="true"
            :value-multiline="true"
            :value-can-be-empty="true"
            :read-multiple="true"
            :read-accept="'*'"
          />
        </template>
      </TreeTab>
      <LabelsTab
        :value="getWorkloadField('metadata')"
        :mode="mode"
        tab-name="labels"
        @input="setWorkloadFieldIfNotEmpty('metadata', $event)"
      />
    </template>
  </TreeTabbed>
</template>

<style scoped>

</style>
