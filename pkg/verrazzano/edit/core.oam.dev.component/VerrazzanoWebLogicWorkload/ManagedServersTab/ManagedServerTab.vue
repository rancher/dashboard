<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ServerPodTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ServerPodTab';
import ServerServiceTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ServerServiceTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'ManagedServerTab',
  components: {
    LabeledInput,
    LabeledSelect,
    ServerPodTab,
    ServerServiceTab,
    TabDeleteButton,
    TreeTab,
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
      this.treeTabLabel = this.value.serverName || this.t('verrazzano.weblogic.tabs.managedServer');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel" :title="t('verrazzano.weblogic.tabs.managedServer')">
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
            :value="getField('serverName')"
            :mode="mode"
            required
            disabled
            :placeholder="getNotSetPlaceholder(value, 'serverName')"
            :label="t('verrazzano.weblogic.fields.managedServers.serverName')"
            @input="setFieldIfNotEmpty('serverName', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            :value="getField('restartVersion')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'restartVersion')"
            :label="t('verrazzano.weblogic.fields.restartVersion')"
            @input="setFieldIfNotEmpty('restartVersion', $event)"
          />
        </div>
        <div class="col span-3">
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
        <div class="col span-3">
          <LabeledSelect
            :value="getField('serverStartState')"
            :mode="mode"
            :options="serverStartStateOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'serverStartState')"
            :label="t('verrazzano.weblogic.fields.serverStartState')"
            @input="setFieldIfNotEmpty('serverStartState', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div>
        <h3>{{ t('verrazzano.weblogic.tabs.serverService') }}</h3>
        <ServerService
          :value="getField('serverService')"
          :mode="mode"
          @input="setFieldIfNotEmpty('serverService', $event)"
        />
      </div>
      <div class="spacer-small" />
    </template>
    <template #nestedTabs>
      <ServerPodTab
        :value="getField('serverPod')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, 'serverPod')"
        @input="setFieldIfNotEmpty('serverPod', $event)"
      />
      <ServerServiceTab
        :value="getField('serverService')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'serverService')"
        @input="setFieldIfNotEmpty('serverService', $event)"
      />
    </template>
  </TreeTab>
</template>
