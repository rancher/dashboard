<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'ServerShutdownTab',
  components: {
    Checkbox,
    LabeledInput,
    LabeledSelect,
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
  computed: {
    shutdownTypes() {
      return [
        { value: 'Graceful', label: this.t('verrazzano.weblogic.types.shutdown.graceful') },
        { value: 'Forced', label: this.t('verrazzano.weblogic.types.shutdown.forced') },
      ];
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.serverShutdown');
    }
  }
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
            :value="getField('ignoreSessions')"
            :mode="mode"
            :label="t('verrazzano.weblogic.fields.shutdown.ignoreSession')"
            @input="setBooleanField('ignoreSessions', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('waitForAllSessions')"
            :mode="mode"
            :label="t('verrazzano.weblogic.fields.shutdown.waitForAllSessions')"
            @input="setBooleanField('waitForAllSessions', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            :value="getField('shutdownType')"
            :mode="mode"
            :options="shutdownTypes"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'shutdownType')"
            :label="t('verrazzano.weblogic.fields.shutdown.shutdownType')"
            @input="setFieldIfNotEmpty('shutdownType', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('timeoutSeconds')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'timeoutSeconds')"
            :label="t('verrazzano.weblogic.fields.shutdown.timeoutSeconds')"
            @input="setNumberField('timeoutSeconds', $event)"
          />
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
