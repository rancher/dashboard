<script>
// Added by Verrazzano
import ClusterServiceTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ClustersTab/ClusterServiceTab';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ServerPodTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ServerPodTab';
import ServerServiceTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ServerServiceTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'ClusterTab',
  components: {
    ClusterServiceTab,
    LabeledInput,
    LabeledSelect,
    ServerPodTab,
    ServerServiceTab,
    TabDeleteButton,
    TreeTab
  },
  mixins: [WebLogicWorkloadHelper],
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
    templateObject: {
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
      this.treeTabLabel = this.value.clusterName || this.t('verrazzano.weblogic.tabs.cluster');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel" :title="t('verrazzano.weblogic.tabs.cluster')">
    <template #beside-header>
      <TabDeleteButton
        :mode="mode"
        :element-name="t('verrazzano.weblogic.tabs.cluster')"
        @click="$emit('delete', value)"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('clusterName')"
            :mode="mode"
            required
            disabled
            :placeholder="getNotSetPlaceholder(value, 'clusterName')"
            :label="t('verrazzano.weblogic.fields.clusters.clusterName')"
            @input="setFieldIfNotEmpty('clusterName', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('replicas')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'replicas')"
            :label="t('verrazzano.weblogic.fields.clusters.replicas')"
            @input="setNumberField('replicas', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            :value="getField('serverStartPolicy')"
            :mode="mode"
            :options="serverStartPolicyOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'serverStartPolicy')"
            :label="t('verrazzano.weblogic.fields.serverStartPolicy')"
            @input="setFieldIfNotEmpty('serverStartPolicy', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('maxConcurrentStartup')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'maxConcurrentStartup')"
            :label="t('verrazzano.weblogic.fields.clusters.maxConcurrentStartup')"
            @input="setNumberField('maxConcurrentStartup', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('maxConcurrentShutdown')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'maxConcurrentShutdown')"
            :label="t('verrazzano.weblogic.fields.clusters.maxConcurrentShutdown')"
            @input="setNumberField('maxConcurrentShutdown', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('maxUnavailable')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'maxUnavailable')"
            :label="t('verrazzano.weblogic.fields.clusters.maxUnavailable')"
            @input="setNumberField('maxUnavailable', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('restartVersion')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'restartVersion')"
            :label="t('verrazzano.weblogic.fields.restartVersion')"
            @input="setFieldIfNotEmpty('restartVersion', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <ServerPodTab
        :value="getField('serverPod')"
        :mode="mode"
        :namespaced-object="value"
        :tab-name="createTabName(treeTabName, 'serverPod')"
        @input="setFieldIfNotEmpty('serverPod', $event)"
        @delete="setField('serverPod', undefined)"
      />
      <ClusterServiceTab
        :value="getField('clusterService')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'clusterService')"
        @input="setFieldIfNotEmpty('clusterService', $event)"
        @delete="setField('clusterService', undefined)"
      />
      <ServerServiceTab
        :value="getField('serverService')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'serverService')"
        @input="setFieldIfNotEmpty('serverService', $event)"
        @delete="setField('serverService', undefined)"
      />
    </template>
  </TreeTab>
</template>
