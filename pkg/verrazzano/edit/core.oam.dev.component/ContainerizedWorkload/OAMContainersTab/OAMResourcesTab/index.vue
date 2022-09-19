<script>
// Added by Verrazzano
import ContainerizedWorkloadHelper from '@pkg/mixins/containerized-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import OAMExtendedResourcesTab
  from '@pkg/edit/core.oam.dev.component/ContainerizedWorkload/OAMContainersTab/OAMResourcesTab/OAMExtendedResourcesTab';
import OAMVolumesTab
  from '@pkg/edit/core.oam.dev.component/ContainerizedWorkload/OAMContainersTab/OAMResourcesTab/OAMVolumesTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'OAMResourcesTab',
  components: {
    LabeledInput,
    OAMExtendedResourcesTab,
    OAMVolumesTab,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [ContainerizedWorkloadHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create',
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
      this.treeTabLabel = this.t('verrazzano.common.tabs.resources');
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
            :value="getField('cpu.required')"
            :mode="mode"
            required
            :placeholder="getNotSetPlaceholder(value, 'cpu.required')"
            :label="t('verrazzano.containerized.fields.requiredCpu')"
            @input="setFieldIfNotEmpty('cpu.required', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('memory.required')"
            :mode="mode"
            required
            :placeholder="getNotSetPlaceholder(value, 'memory.required')"
            :label="t('verrazzano.containerized.fields.requiredMemory')"
            @input="setFieldIfNotEmpty('memory.required', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('gpu.required')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'gpu.required')"
            :label="t('verrazzano.containerized.fields.requiredGpu')"
            @input="setFieldIfNotEmpty('gpu.required', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <OAMVolumesTab
        :value="getListField('volumes')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'volumes')"
        @input="setFieldIfNotEmpty('volumes', $event)"
        @delete="setField('volumes', undefined)"
      />
      <OAMExtendedResourcesTab
        :value="getListField('extended')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'extendedResources')"
        @input="setFieldIfNotEmpty('extended', $event)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
