<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import JVMDebugSpecTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/JVMDebugSpecTab';
import JVMGarbageCollectorSpecTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/JVMGarbageCollectorSpecTab';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VolumeTab from '@pkg/components/VolumesTab/VolumeTab';
import JVMMemorySpecTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/JVMMemorySpecTab';

export default {
  name:       'JVMSpecTab',
  components: {
    JVMMemorySpecTab,
    JVMDebugSpecTab,
    JVMGarbageCollectorSpecTab,
    Checkbox,
    LabeledArrayList,
    LabeledInput,
    TabDeleteButton,
    TreeTab,
    VolumeTab,
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
    jmxmpEnabled() {
      const result = this.getField('jmxmp.enabled');

      return result ? Boolean(result) : false;
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.value.name || this.t('verrazzano.coherence.tabs.jvm');
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
        <div class="col span-6">
          <LabeledArrayList
            :value="getListField('classpath')"
            :mode="mode"
            :value-label="t('verrazzano.coherence.fields.classpathEntry')"
            :add-label="t('verrazzano.coherence.buttons.addClasspathEntry')"
            @input="setFieldIfNotEmpty('classpath', $event)"
          />
        </div>
        <div class="col span-6">
          <LabeledArrayList
            :value="getListField('args')"
            :mode="mode"
            :value-label="t('verrazzano.coherence.fields.jvmArg')"
            :add-label="t('verrazzano.coherence.buttons.addJVMArg')"
            @input="setFieldIfNotEmpty('args', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-6">
          <Checkbox
            :value="getField('useContainerLimits')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.useContainerLimits')"
            @input="setBooleanField('useContainerLimits', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('useJibClasspath')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.useJibClasspath')"
            @input="setBooleanField('useJibClasspath', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('jmxmp.enabled')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.jmxmp.enabled')"
            @input="setBooleanField('jmxmp.enabled', $event)"
          />
        </div>
        <div v-if="jmxmpEnabled" class="col span-4">
          <LabeledInput
            :value="getField('jmxmp.port')"
            :mode="mode"
            type="Number"
            :min="minPortNumber"
            :max="maxPortNumber"
            :placeholder="getNotSetPlaceholder(value, 'jmxmp.port')"
            :label="t('verrazzano.coherence.fields.jmxmp.port')"
            @input="setNumberField('jmxmp.port', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <JVMDebugSpecTab
        :value="getField('debug')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'debug')"
        @input="setFieldIfNotEmpty('debug', $event)"
        @delete="setField('debug', undefined)"
      />
      <JVMGarbageCollectorSpecTab
        :value="getField('gc')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'gc')"
        @input="setFieldIfNotEmpty('gc', $event)"
        @delete="setField('gc', undefined)"
      />
      <JVMMemorySpecTab
        :value="getField('memory')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'memory')"
        @input="setFieldIfNotEmpty('memory', $event)"
        @delete="setField('memory', undefined)"
      />
      <VolumeTab
        :value="getField('diagnosticsVolume')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        name-is-editable
        :tab-name="createTabName(treeTabName, 'diagnosticsVolume')"
        :tab-label="t('verrazzano.coherence.tabs.diagnosticsVolume')"
        @input="setFieldIfNotEmpty('diagnosticsVolume', $event)"
        @delete="setField('diagnosticsVolume', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
