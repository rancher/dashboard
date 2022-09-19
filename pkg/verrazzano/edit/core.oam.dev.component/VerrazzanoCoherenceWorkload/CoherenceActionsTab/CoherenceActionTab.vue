<script>
// Added by Verrazzano
import ActionJobTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/CoherenceActionsTab/ActionJobTab';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'CoherenceActionTab',
  components: {
    ActionJobTab,
    LabeledInput,
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
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.value.name || this.t('verrazzano.coherence.tabs.action');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="t('verrazzano.coherence.tabs.action')"
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
            :placeholder="getNotSetPlaceholder(value, 'name')"
            :label="t('verrazzano.coherence.fields.actionName')"
            @input="setFieldIfNotEmpty('name', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('probe.timeoutSeconds')"
            :mode="mode"
            type="Number"
            min="1"
            :placeholder="getNotSetPlaceholder(value, 'probe.timeoutSeconds')"
            :label="t('verrazzano.coherence.fields.actionProbeTimeoutSeconds')"
            @input="setFieldIfNotEmpty('probe.timeoutSeconds', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <ActionJobTab
        :value="getField('job')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, 'actionJob')"
        @input="setFieldIfNotEmpty('job', $event)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
