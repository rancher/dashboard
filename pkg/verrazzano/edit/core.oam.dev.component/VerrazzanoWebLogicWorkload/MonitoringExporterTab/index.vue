<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import MonitoringExporterConfiguration
  from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/MonitoringExporterTab/MonitoringExporterConfiguration';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WeblogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'MonitoringExporterTab',
  components: {
    LabeledInput,
    LabeledSelect,
    MonitoringExporterConfiguration,
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
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.monitoringExporter');
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
            :label="t('verrazzano.weblogic.fields.monitoringExporter.image')"
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
            :label="t('verrazzano.weblogic.fields.monitoringExporter.imagePullPolicy')"
            @input="setFieldIfNotEmpty('imagePullPolicy', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            :value="getField('port')"
            :mode="mode"
            type="Number"
            :min="minPortNumber"
            :max="maxPortNumber"
            :placeholder="getNotSetPlaceholder(value, 'port')"
            :label="t('verrazzano.weblogic.fields.monitoringExporter.port')"
            @input="setNumberField('image', $event)"
          />
        </div>
      </div>
      <div class="spacer" />
      <div>
        <h3>{{ t('verrazzano.weblogic.titles.monitoringExporterConfiguration') }}</h3>
        <MonitoringExporterConfiguration
          :value="getField('configuration')"
          :mode="mode"
          @input="setFieldIfNotEmpty('configuration', $event)"
        />
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
