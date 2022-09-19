<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import Labels from '@pkg/components/LabelsTab/Labels';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WeblogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'ServerServiceTab',
  components: {
    Checkbox,
    Labels,
    TabDeleteButton,
    TreeTab,
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
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.serverService');
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
          <Checkbox
            :value="getField('precreateService')"
            :mode="mode"
            :label="t('verrazzano.weblogic.fields.preCreateService')"
            @input="setBooleanField('precreateService', $event)"
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
