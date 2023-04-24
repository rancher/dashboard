<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'MonitoringExporterConfiguration',
  components: { Checkbox },
  mixins:     [WebLogicWorkloadHelper],
  props:      {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <div class="spacer-tiny" />
        <Checkbox
          :value="getField('metricsNameSnakeCase')"
          :mode="mode"
          :label="t('verrazzano.weblogic.fields.monitoringExporter.metricsNameSnakeCase')"
          @input="setBooleanField('metricsNameSnakeCase', $event)"
        />
        <div class="spacer-tiny" />
        <Checkbox
          :value="getField('domainQualifier')"
          :mode="mode"
          :label="t('verrazzano.weblogic.fields.monitoringExporter.domainQualifier')"
          @input="setBooleanField('domainQualifier', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <p>{{ t('verrazzano.weblogic.fields.monitoringExporter.queries') }}</p>
  </div>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
