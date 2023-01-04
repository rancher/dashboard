<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'WDTTimeoutsTab',
  components: {
    LabeledInput,
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
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.wdtTimeouts');
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
      <div>
        <div class="row">
          <div class="col span-3">
            <LabeledInput
              :value="getField('activateTimeoutMillis')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'activateTimeoutMillis')"
              :label="t('verrazzano.weblogic.fields.configuration.model.onlineUpdates.wdtTimeouts.activateTimeoutMillis')"
              @input="setNumberField('activateTimeoutMillis', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('connectTimeoutMillis')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'connectTimeoutMillis')"
              :label="t('verrazzano.weblogic.fields.configuration.model.onlineUpdates.wdtTimeouts.connectTimeoutMillis')"
              @input="setNumberField('connectTimeoutMillis', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('deployTimeoutMillis')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'deployTimeoutMillis')"
              :label="t('verrazzano.weblogic.fields.configuration.model.onlineUpdates.wdtTimeouts.deployTimeoutMillis')"
              @input="setNumberField('deployTimeoutMillis', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('redeployTimeoutMillis')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'redeployTimeoutMillis')"
              :label="t('verrazzano.weblogic.fields.configuration.model.onlineUpdates.wdtTimeouts.redeployTimeoutMillis')"
              @input="setNumberField('redeployTimeoutMillis', $event)"
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-3">
            <LabeledInput
              :value="getField('setServerGroupsTimeoutMillis')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'setServerGroupsTimeoutMillis')"
              :label="t('verrazzano.weblogic.fields.configuration.model.onlineUpdates.wdtTimeouts.setServerGroupsTimeoutMillis')"
              @input="setNumberField('setServerGroupsTimeoutMillis', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('startApplicationTimeoutMillis')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'startApplicationTimeoutMillis')"
              :label="t('verrazzano.weblogic.fields.configuration.model.onlineUpdates.wdtTimeouts.startApplicationTimeoutMillis')"
              @input="setNumberField('startApplicationTimeoutMillis', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('stopApplicationTimeoutMillis')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'stopApplicationTimeoutMillis')"
              :label="t('verrazzano.weblogic.fields.configuration.model.onlineUpdates.wdtTimeouts.stopApplicationTimeoutMillis')"
              @input="setNumberField('stopApplicationTimeoutMillis', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('undeployTimeoutMillis')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'undeployTimeoutMillis')"
              :label="t('verrazzano.weblogic.fields.configuration.model.onlineUpdates.wdtTimeouts.undeployTimeoutMillis')"
              @input="setNumberField('undeployTimeoutMillis', $event)"
            />
          </div>
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
