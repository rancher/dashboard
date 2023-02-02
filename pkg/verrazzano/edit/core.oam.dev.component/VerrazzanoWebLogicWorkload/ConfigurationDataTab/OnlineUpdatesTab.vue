<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WDTTimeoutsTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ConfigurationDataTab/WDTTimeoutsTab';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'OnlineUpdatesTab',
  components: {
    Checkbox,
    LabeledSelect,
    TabDeleteButton,
    TreeTab,
    WDTTimeoutsTab,
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
    weight: {
      type:    Number,
      default: 0
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  computed: {
    onlineUpdatesEnabled() {
      return !!this.getField('enabled');
    },
    nonDynamicChangesOptions() {
      return [
        { value: 'CommitUpdateOnly', label: this.t('verrazzano.weblogic.types.onNonDynamicChanges.commitUpdateOnly') },
        { value: 'CommitUpdateAndRoll', label: this.t('verrazzano.weblogic.types.onNonDynamicChanges.commitUpdateAndRoll') },
      ];
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.onlineUpdates');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel" :weight="weight">
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
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('enabled')"
            :mode="mode"
            :label="t('verrazzano.weblogic.fields.configuration.model.onlineUpdates.enabled')"
            @input="setField('enabled', $event)"
          />
        </div>
      </div>
      <div v-if="!!getField('enabled')" class="spacer-small">
        <div class="row">
          <div class="col span-4">
            <LabeledSelect
              :value="getField('onNonDynamicChanges')"
              :mode="mode"
              :options="nonDynamicChangesOptions"
              option-key="value"
              option-label="label"
              :placeholder="getNotSetPlaceholder(value, 'onNonDynamicChanges')"
              :label="t('verrazzano.weblogic.fields.configuration.model.onlineUpdates.onNonDynamicChanges')"
              @input="setField('onNonDynamicChanges', $event)"
            />
          </div>
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <WDTTimeoutsTab
        v-if="onlineUpdatesEnabled"
        :value="getField('wdtTimeouts')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'wdtTimeouts')"
        @input="setFieldIfNotEmpty('wdtTimeouts', $event)"
        @delete="setField('wdtTimeouts', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
