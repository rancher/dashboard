<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import ContainerResourcesTab from '@pkg/components/ContainerResourcesTab';
import EnvironmentVariables from '@pkg/components/EnvironmentVariables';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VolumeMountsTab from '@pkg/components/VolumeMountsTab';
import WeblogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

import { SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'FluentdSpecificationTab',
  components: {
    Checkbox,
    ContainerResourcesTab,
    EnvironmentVariables,
    LabeledInput,
    LabeledSelect,
    TabDeleteButton,
    TreeTab,
    VolumeMountsTab,
  },
  mixins: [WeblogicWorkloadHelper],
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
      treeTabName:     this.tabName,
      treeTabLabel:    this.tabLabel,
      fetchInProgress: true,
      namespace:       this.namespacedObject.metadata?.namespace,
      allSecrets:      {},
      secrets:         []
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
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.fluentd');
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
        <div class="col span-6">
          <LabeledInput
            :value="getField('image')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'image')"
            :label="t('verrazzano.weblogic.fields.fluentd.image')"
            @input="setFieldIfNotEmpty('image', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledSelect
            :value="getField('imagePullPolicy')"
            :mode="mode"
            :options="imagePullPolicyOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'imagePullPolicy')"
            :label="t('verrazzano.weblogic.fields.fluentd.imagePullPolicy')"
            @input="setFieldIfNotEmpty('imagePullPolicy', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledSelect
            :value="getField('elasticSearchCredentials')"
            :mode="mode"
            required
            :options="secrets"
            option-label="metadata.name"
            :reduce="secret => secret.metadata.name"
            :placeholder="getNotSetPlaceholder(value, 'elasticSearchCredentials')"
            :label="t('verrazzano.weblogic.fields.fluentd.elasticSearchCredentials')"
            @input="setFieldIfNotEmpty('elasticSearchCredentials', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            :value="getField('fluentdConfiguration')"
            :mode="mode"
            type="multiline"
            :placeholder="getNotSetPlaceholder(value, 'fluentdConfiguration')"
            :label="t('verrazzano.weblogic.fields.fluentd.fluentdConfiguration')"
            @input="setFieldIfNotEmpty('fluentdConfiguration', $event)"
          />
        </div>
        <div class="col span-4">
          <div class="spacer-small" />
          <Checkbox
            :value="getField('watchIntrospectorLogs')"
            :mode="mode"
            :label="t('verrazzano.weblogic.fields.fluentd.watchIntrospectorLogs')"
            @input="setBooleanField('watchIntrospectorLogs', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <TreeTab :name="createTabName(treeTabName, 'envVars')" :label="t('verrazzano.common.tabs.environmentVariables')">
        <template #beside-header>
          <TabDeleteButton
            :element-name="t('verrazzano.common.tabs.environmentVariables')"
            :mode="mode"
            @click="setField('env', undefined)"
          />
        </template>
        <template #default>
          <EnvironmentVariables
            :value="value"
            :mode="mode"
            :namespaced-object="namespacedObject"
            :enable-env-from-options="false"
            @input="$emit('input', value)"
          />
        </template>
      </TreeTab>
      <ContainerResourcesTab
        :value="getField('resources')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'resources')"
        @input="setFieldIfNotEmpty('resources', $event)"
        @delete="setField('resources', undefined)"
      />
      <VolumeMountsTab
        :value="getListField('volumeMounts')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'volumeMounts')"
        @input="setFieldIfNotEmpty('volumeMounts', $event)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
