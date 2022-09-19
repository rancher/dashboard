<script>
// Added by Verrazzano
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ServiceMonitorSpecTab
  from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/NamedPortsSpecTab/ServiceMonitorSpecTab';
import ServiceSpecTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/NamedPortsSpecTab/ServiceSpecTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'NamedPortSpecTab',
  components: {
    LabeledInput,
    LabeledSelect,
    ServiceMonitorSpecTab,
    ServiceSpecTab,
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
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  computed: {
    protocolOptions() {
      return [
        { value: 'TCP', label: this.t('verrazzano.coherence.types.protocol.tcp') },
        { value: 'UDP', label: this.t('verrazzano.coherence.types.protocol.udp') },
      ];
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.value.name || this.t('verrazzano.coherence.tabs.port');
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
          <LabeledInput
            :value="getField('name')"
            :mode="mode"
            required
            :placeholder="getNotSetPlaceholder(value, 'name')"
            :label="t('verrazzano.coherence.fields.namedPort.name')"
            @input="setFieldIfNotEmpty('name', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('port')"
            :mode="mode"
            type="Number"
            :min="minPortNumber"
            :max="maxPortNumber"
            :placeholder="getNotSetPlaceholder(value, 'port')"
            :label="t('verrazzano.coherence.fields.namedPort.port')"
            @input="setNumberField('port', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            :value="getField('protocol')"
            :mode="mode"
            :options="protocolOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'protocol')"
            :label="t('verrazzano.coherence.fields.namedPort.protocol')"
            @input="setFieldIfNotEmpty('protocol', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-3">
          <LabeledInput
            :value="getField('appProtocol')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'appProtocol')"
            :label="t('verrazzano.coherence.fields.namedPort.appProtocol')"
            @input="setFieldIfNotEmpty('appProtocol', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            :value="getField('nodePort')"
            :mode="mode"
            type="Number"
            min="30000"
            max="32767"
            :placeholder="getNotSetPlaceholder(value, 'nodePort')"
            :label="t('verrazzano.coherence.fields.namedPort.nodePort')"
            @input="setNumberField('nodePort', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            :value="getField('hostPort')"
            :mode="mode"
            type="Number"
            :min="minPortNumber"
            :max="maxPortNumber"
            :placeholder="getNotSetPlaceholder(value, 'hostPort')"
            :label="t('verrazzano.coherence.fields.namedPort.hostPort')"
            @input="setNumberField('hostPort', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            :value="getField('hostIP')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'hostIP')"
            :label="t('verrazzano.coherence.fields.namedPort.hostIP')"
            @input="setFieldIfNotEmpty('hostIP', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <ServiceSpecTab
        :value="getField('service')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'service')"
        @input="setFieldIfNotEmpty('service', $event)"
        @delete="setField('service', undefined)"
      />
      <ServiceMonitorSpecTab
        :value="getField('serviceMonitor')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, 'serviceMonitor')"
        @input="setFieldIfNotEmpty('serviceMonitor', $event)"
        @delete="setField('serviceMonitor', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
