<script>
// Added by Verrazzano
import ContainerizedWorkloadHelper from '@pkg/mixins/containerized-workload-helper';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import OAMConfigFilesTab from '@pkg/edit/core.oam.dev.component/ContainerizedWorkload/OAMContainersTab/OAMConfigFilesTab';
import OAMEnvironmentVariablesTab
  from '@pkg/edit/core.oam.dev.component/ContainerizedWorkload/OAMContainersTab/OAMEnvironmentVariablesTab';
import OAMHealthProbeTab from '@pkg/edit/core.oam.dev.component/ContainerizedWorkload/OAMContainersTab/OAMHealthProbeTab';
import OAMPortsTab from '@pkg/edit/core.oam.dev.component/ContainerizedWorkload/OAMContainersTab/OAMPortsTab';
import OAMResourcesTab from '@pkg/edit/core.oam.dev.component/ContainerizedWorkload/OAMContainersTab/OAMResourcesTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

import { SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'OAMContainerTab',
  components: {
    LabeledArrayList,
    LabeledInput,
    LabeledSelect,
    OAMConfigFilesTab,
    OAMEnvironmentVariablesTab,
    OAMHealthProbeTab,
    OAMPortsTab,
    OAMResourcesTab,
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
      treeTabName:     this.tabName,
      treeTabLabel:    this.tabLabel,
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
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.value.name || this.t('verrazzano.common.tabs.container');
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
        <div class="col span-3">
          <LabeledInput
            :value="getField('name')"
            :mode="mode"
            required
            disabled
            :placeholder="getNotSetPlaceholder(value, 'name')"
            :label="t('verrazzano.common.fields.container.name')"
            @input="setFieldIfNotEmpty('name', $event)"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            :value="getField('image')"
            :mode="mode"
            required
            :placeholder="getNotSetPlaceholder(value, 'image')"
            :label="t('verrazzano.common.fields.container.image')"
            @input="setFieldIfNotEmpty('image', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledSelect
            :value="getField('imagePullSecret')"
            :mode="mode"
            :options="secrets"
            option-label="metadata.name"
            :reduce="secret => secret.metadata.name"
            :placeholder="getNotSetPlaceholder(value, 'imagePullSecret')"
            :label="t('verrazzano.common.fields.container.imagePullSecret')"
            @input="setFieldIfNotEmpty('imagePullSecret', $event)"
          />
        </div>
      </div>
      <div class="spacer" />
      <div class="row">
        <div class="col span-6">
          <h3>{{ t('verrazzano.common.titles.containerCmd') }}</h3>
          <LabeledArrayList
            :value="getListField('cmd')"
            :mode="mode"
            :value-label="t('verrazzano.common.fields.container.command')"
            :add-label="t('verrazzano.common.buttons.addCommandArg')"
            @input="setFieldIfNotEmpty('cmd', $event)"
          />
        </div>
        <div class="col span-6">
          <h3>{{ t('verrazzano.common.titles.containerArgs') }}</h3>
          <LabeledArrayList
            :value="getListField('args')"
            :mode="mode"
            :value-label="t('verrazzano.common.fields.container.argument')"
            :add-label="t('verrazzano.common.buttons.addArgument')"
            @input="setFieldIfNotEmpty('args', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <OAMEnvironmentVariablesTab
        :value="getListField('env')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'envVars')"
        @input="setFieldIfNotEmpty('env', $event)"
      />
      <OAMPortsTab
        :value="getListField('ports')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'ports')"
        @input="setFieldIfNotEmpty('ports', $event)"
      />
      <OAMConfigFilesTab
        :value="getListField('config')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'configFiles')"
        @input="setFieldIfNotEmpty('config', $event)"
      />
      <OAMResourcesTab
        :value="getField('resources')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'resources')"
        @input="setFieldIfNotEmpty('resources', $event)"
        @delete="setField('resources', undefined)"
      />
      <OAMHealthProbeTab
        :value="getField('livenessProbe')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'livenessProbe')"
        :tab-label="t('verrazzano.containerized.tabs.livenessProbe')"
        @input="setFieldIfNotEmpty('livenessProbe', $event)"
        @delete="setField('livenessProbe', undefined)"
      />
      <OAMHealthProbeTab
        :value="getField('readinessProbe')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'readinessProbe')"
        :tab-label="t('verrazzano.containerized.tabs.readinessProbe')"
        @input="setFieldIfNotEmpty('readinessProbe', $event)"
        @delete="setField('readinessProbe', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
