<script>
// Added by Verrazzano
import AdminServiceTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/AdminServerTab/AdminServiceTab';
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ServerPodTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ServerPodTab';
import ServerServiceTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ServerServiceTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WeblogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'AdminServerTab',
  components: {
    AdminServiceTab,
    Checkbox,
    LabeledInput,
    LabeledSelect,
    ServerPodTab,
    ServerServiceTab,
    TabDeleteButton,
    TreeTab
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
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.adminServer');
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
          <Checkbox
            :value="getField('adminChannelPortForwardingEnabled')"
            :mode="mode"
            :label="t('verrazzano.weblogic.fields.adminChannelPortForwardingEnabled')"
            @input="setBooleanField('adminChannelPortForwardingEnabled', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('restartVersion')"
            :mode="mode"
            type="Number"
            min="0"
            :label="t('verrazzano.weblogic.fields.restartVersion')"
            @input="setNumberField('restartVersion', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            :value="getField('serverStartPolicy')"
            :mode="mode"
            :options="serverStartPolicyOptions"
            option-key="value"
            option-label="label"
            :label="t('verrazzano.weblogic.fields.serverStartPolicy')"
            @input="setField('serverStartPolicy', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            :value="getField('serverStartState')"
            :mode="mode"
            :options="serverStartStateOptions"
            option-key="value"
            option-label="label"
            :label="t('verrazzano.weblogic.fields.serverStartState')"
            @input="setField('serverStartState', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <ServerPodTab
        :value="getField('serverPod')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, 'serverPod')"
        @input="setFieldIfNotEmpty('serverPod', $event)"
        @delete="setField('serverPod', undefined)"
      />
      <AdminServiceTab
        :value="getField('adminService')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'adminService')"
        @input="setFieldIfNotEmpty('adminService', $event)"
        @delete="setField('adminService', undefined)"
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
