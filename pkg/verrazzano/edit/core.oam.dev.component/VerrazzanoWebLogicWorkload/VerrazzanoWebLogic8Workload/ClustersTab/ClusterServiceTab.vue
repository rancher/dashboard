<script>
// Added by Verrazzano
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Labels from '@pkg/components/LabelsTab/Labels';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'ClusterService',
  components: {
    LabeledSelect,
    Labels,
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
      this.treeTabLabel = this.value.clusterName || this.t('verrazzano.weblogic.tabs.clusterService');
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
          <LabeledSelect
            :value="getField('sessionAffinity')"
            :mode="mode"
            :options="sessionAffinityOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'sessionAffinity')"
            :label="t('verrazzano.common.fields.sessionAffinity')"
            @input="setFieldIfNotEmpty('sessionAffinity', $event)"
          />
        </div>
      </div>
      <div class="spacer" />
      <div>
        <Labels
          :value="value"
          :mode="mode"
          @input="$emit('input', value)"
        />
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
