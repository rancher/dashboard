<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import PersistenceSpecTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/PersistenceSpecTab';
import PortSpecWithSSL from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/PortSpecWithSSL';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

import { NAMESPACE } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'CoherenceSpecTab',
  components: {
    Checkbox,
    LabeledArrayList,
    LabeledInput,
    LabeledSelect,
    PersistenceSpecTab,
    PortSpecWithSSL,
    TabDeleteButton,
    TreeTab,
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
    },
    tabName: {
      type:     String,
      required: true,
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      isLoading:     true,
      treeTabName:   this.tabName,
      treeTabLabel:  this.treeTabLabel,
      allNamespaces: [],
    };
  },
  async fetch() {
    const requests = { namespaces: this.$store.dispatch('management/findAll', { type: NAMESPACE }) };

    const hash = await allHash(requests);

    this.allNamespaces = hash.namespaces;
  },
  computed: {
    showWKA() {
      const excludeFromWKA = this.getField('excludeFromWKA');

      return excludeFromWKA !== false;
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.coherence.tabs.coherence');
    }
  },
  mounted() {
    this.isLoading = false;
  },
  watch: {
    excludeFromWKA(neu, old) {
      if (!this.isLoading && neu === false) {
        this.setField('wka', undefined);
      }
    },
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
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('storageEnabled')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.storageEnabled')"
            @input="setBooleanField('storageEnabled', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('excludeFromWKA')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.excludeFromWKA')"
            @input="setBooleanField('excludeFromWKA', $event)"
          />
        </div>
        <div class="col span-4">
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('skipVersionCheck')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.skipVersionCheck')"
            @input="setBooleanField('skipVersionCheck', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('enableIpMonitor')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.enableIpMonitor')"
            @input="setBooleanField('enableIpMonitor', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('cacheConfig')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'cacheConfig')"
            :label="t('verrazzano.coherence.fields.cacheConfig')"
            @input="setFieldIfNotEmpty('cacheConfig', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('overrideConfig')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'overrideConfig')"
            :label="t('verrazzano.coherence.fields.overrideConfig')"
            @input="setFieldIfNotEmpty('overrideConfig', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('logLevel')"
            :mode="mode"
            type="Number"
            min="-1"
            max="9"
            :placeholder="getNotSetPlaceholder(value, 'logLevel')"
            :label="t('verrazzano.coherence.fields.logLevel')"
            @input="setNumberField('logLevel', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('localPort')"
            :mode="mode"
            type="Number"
            :min="minPortNumber"
            :max="maxPortNumber"
            :placeholder="getNotSetPlaceholder(value, 'localPort')"
            :label="t('verrazzano.coherence.fields.localPort')"
            @input="setNumberField('localPort', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('localPortAdjust')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'localPortAdjust')"
            :label="t('verrazzano.coherence.fields.localPortAdjust')"
            @input="setFieldIfNotEmpty('localPortAdjust', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('tracing.ratio')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'tracing.ratio')"
            :label="t('verrazzano.coherence.fields.tracingRatio')"
            @input="setFieldIfNotEmpty('tracing.ratio', $event)"
          />
        </div>
      </div>
      <div v-if="showWKA">
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              :value="getField('wka.deployment')"
              :mode="mode"
              required
              :placeholder="getNotSetPlaceholder(value, 'wka.deployment')"
              :label="t('verrazzano.coherence.fields.wka.deployment')"
              @input="setFieldIfNotEmpty('wka.deployment', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledSelect
              :value="getField('wka.namespace')"
              :mode="mode"
              :options="allNamespaces"
              option-label="metadata.name"
              :reduce="namespace => namespace.metadata.name"
              :placeholder="getNotSetPlaceholder(value, 'wka.namespace')"
              :label="t('verrazzano.coherence.fields.wka.namespace')"
              @input="setFieldIfNotEmpty('wka.namespace', $event)"
            />
          </div>
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-6">
          <LabeledArrayList
            :value="getListField('allowEndangeredForStatusHA')"
            :mode="mode"
            :value-label="t('verrazzano.coherence.fields.allowEndangeredForStatusHA')"
            :add-label="t('verrazzano.coherence.buttons.addAllowEndangeredForStatusHA')"
            @input="setFieldIfNotEmpty('allowEndangeredForStatusHA', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <PersistenceSpecTab
        :value="getField('persistence')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, 'persistence')"
        @input="setFieldIfNotEmpty('persistence', $event)"
        @delete="setField('persistence', undefined)"
      />
      <TreeTab :name="createTabName(treeTabName, 'management')" :label="t('verrazzano.coherence.tabs.restManagement')">
        <template #default>
          <PortSpecWithSSL
            :value="getField('management')"
            :mode="mode"
            :namespaced-object="namespacedObject"
            @input="setFieldIfNotEmpty('management', $event)"
          />
        </template>
      </TreeTab>
      <TreeTab :name="createTabName(treeTabName, 'metrics')" :label="t('verrazzano.coherence.tabs.metricsPublishing')">
        <template #default>
          <PortSpecWithSSL
            :value="getField('metrics')"
            :mode="mode"
            :namespaced-object="namespacedObject"
            @input="setFieldIfNotEmpty('metrics', $event)"
          />
        </template>
      </TreeTab>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
