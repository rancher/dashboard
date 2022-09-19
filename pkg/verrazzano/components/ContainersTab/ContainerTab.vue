<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import ContainerLifecycleTab from '@pkg/components/ContainersTab/ContainerLifecycleTab';
import ContainerPortsTab from '@pkg/components/ContainersTab/ContainerPortsTab';
import ContainerProbeTab from '@pkg/components/ContainerProbeTab';
import ContainerResourcesTab from '@pkg/components/ContainerResourcesTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import EnvironmentVariables from '@pkg/components/EnvironmentVariables';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';
import VolumeDevicesTab from '@pkg/components/VolumeDevicesTab';
import VolumeMountsTab from '@pkg/components/VolumeMountsTab';

export default {
  name:       'ContainerTab',
  components: {
    Checkbox,
    ContainerLifecycleTab,
    ContainerPortsTab,
    ContainerProbeTab,
    ContainerResourcesTab,
    EnvironmentVariables,
    LabeledArrayList,
    LabeledInput,
    LabeledSelect,
    TabDeleteButton,
    TreeTab,
    VolumeDevicesTab,
    VolumeMountsTab,
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
    isEphemeral: {
      type:    Boolean,
      default: false
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
      type:     String,
      required: true
    },
    typeLabel: {
      type:    String,
      default: ''
    }
  },
  computed: {
    terminationMessagePolicyOptions() {
      return [
        { value: 'File', label: this.t('verrazzano.common.types.terminationMessagePolicy.file') },
        { value: 'FallbackToLogsOnError', label: this.t('verrazzano.common.types.terminationMessagePolicy.fallbackToLogsOnError') },
      ];
    },
    containerTypeLabel() {
      return this.typeLabel ? this.typeLabel : this.t('verrazzano.common.tabs.container');
    }
  },
  methods: {
    deleteContainer() {
      this.$emit('delete', this.value);
    }
  },
};
</script>

<template>
  <TreeTab :name="tabName" :label="tabLabel" :title="containerTypeLabel">
    <template #beside-header>
      <TabDeleteButton
        :mode="mode"
        :element-name="containerTypeLabel"
        @click="deleteContainer()"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-3">
          <LabeledInput
            :value="getField('name')"
            :mode="mode"
            required
            :label="t('verrazzano.common.fields.container.name')"
            @input="setField('name', $event)"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            :value="getField('image')"
            :mode="mode"
            :label="t('verrazzano.common.fields.container.image')"
            @input="setField('image', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledSelect
            :value="getField('imagePullPolicy')"
            :mode="mode"
            :options="imagePullPolicyOptions"
            option-key="value"
            option-label="label"
            :label="t('verrazzano.common.fields.container.imagePullPolicy')"
            @input="setField('imagePullPolicy', $event)"
          />
        </div>
      </div>
      <div v-if="isEphemeral">
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-3">
            <LabeledInput
              :value="getField('targetContainerName')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'targetContainerName')"
              :label="t('verrazzano.common.fields.container.targetContainerName')"
              @input="setField('targetContainerName', $event)"
            />
          </div>
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <TreeTab :name="createTabName(tabName, 'execution')" :label="t('verrazzano.common.tabs.executionEnvironment')">
        <div class="row">
          <div class="col span-6">
            <LabeledArrayList
              :value="getField('command')"
              :mode="mode"
              :value-label="t('verrazzano.common.fields.container.command')"
              :add-label="t('verrazzano.common.buttons.addCommandArg')"
              @input="setFieldIfNotEmpty('command', $event)"
            />
          </div>
          <div class="col span-6">
            <LabeledArrayList
              :value="getField('args')"
              :mode="mode"
              :value-label="t('verrazzano.common.fields.container.argument')"
              :add-label="t('verrazzano.common.buttons.addArgument')"
              @input="setFieldIfNotEmpty('args', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-3">
            <Checkbox
              :value="getField('stdin')"
              :mode="mode"
              :label="t('verrazzano.common.fields.container.stdin')"
              @input="setBooleanField('stdin', $event)"
            />
            <div class="spacer-tiny" />
            <Checkbox
              :value="getField('stdinOnce')"
              :mode="mode"
              :label="t('verrazzano.common.fields.container.stdinOnce')"
              @input="setBooleanField('stdinOnce', $event)"
            />
            <div class="spacer-tiny" />
            <Checkbox
              :value="getField('tty')"
              :mode="mode"
              :label="t('verrazzano.common.fields.container.tty')"
              @input="setBooleanField('tty', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('workingDir')"
              :mode="mode"
              :label="t('verrazzano.common.fields.container.workingDir')"
              @input="setField('workingDir', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('terminationMessagePath')"
              :mode="mode"
              :label="t('verrazzano.common.fields.container.terminationMessagePath')"
              @input="setField('terminationMessagePath', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledSelect
              :value="getField('terminationMessagePolicy')"
              :mode="mode"
              :options="terminationMessagePolicyOptions"
              option-key="value"
              option-label="label"
              :label="t('verrazzano.common.fields.container.terminationMessagePolicy')"
              @input="setField('terminationMessagePolicy', $event)"
            />
          </div>
        </div>
        <div class="spacer" />
        <div>
          <h3>{{ t('verrazzano.common.titles.envVars') }}</h3>
          <EnvironmentVariables
            :value="value"
            :mode="mode"
            :namespaced-object="namespacedObject"
            @input="$emit('input', $event)"
          />
        </div>
      </TreeTab>
      <ContainerPortsTab
        :value="value"
        :mode="mode"
        :tab-name="createTabName(tabName, 'ports')"
        @input="$emit('input', $event)"
      />
      <ContainerResourcesTab
        :value="getField('resources')"
        :mode="mode"
        :tab-name="createTabName(tabName, 'resources')"
        @input="setFieldIfNotEmpty('resources', $event)"
      />
      <ContainerProbeTab
        :value="getField('livenessProbe')"
        :mode="mode"
        :tab-name="createTabName(tabName, 'livenessProbe')"
        :tab-label="t('verrazzano.common.tabs.livenessProbe')"
        @input="setFieldIfNotEmpty('livenessProbe', $event)"
        @delete="setField('livenessProbe', undefined)"
      />
      <ContainerProbeTab
        :value="getField('readinessProbe')"
        :mode="mode"
        is-readiness-probe
        :tab-name="createTabName(tabName, 'readinessProbe')"
        :tab-label="t('verrazzano.common.tabs.readinessProbe')"
        @input="setFieldIfNotEmpty('readinessProbe', $event)"
        @delete="setField('livenessProbe', undefined)"
      />
      <ContainerProbeTab
        :value="getField('startupProbe')"
        :mode="mode"
        :tab-name="createTabName(tabName, 'startupProbe')"
        :tab-label="t('verrazzano.common.tabs.startupProbe')"
        @input="setFieldIfNotEmpty('startupProbe', $event)"
        @delete="setField('startupProbe', undefined)"
      />
      <ContainerLifecycleTab
        :value="getField('lifecycle')"
        :mode="mode"
        :tab-name="createTabName(tabName, 'lifecycle')"
        @input="setFieldIfNotEmpty('lifecycle', $event)"
      />
      <VolumeMountsTab
        :value="getListField('volumeMounts')"
        :mode="mode"
        :tab-name="createTabName(tabName, 'volumeMounts')"
        @input="setFieldIfNotEmpty('volumeMounts', $event)"
      />
      <VolumeDevicesTab
        :value="getListField('volumeDevices')"
        :mode="mode"
        :tab-name="createTabName(tabName, 'volumeDevices')"
        @input="setFieldIfNotEmpty('volumeDevices', $event)"
      />
    </template>
  </TreeTab>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
