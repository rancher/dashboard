<script>
// Added by Verrazzano
import AdminServerTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/AdminServerTab';
import AuxiliaryImageVolumesTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/VerrazzanoWebLogic8Workload/AuxiliaryImageVolumesTab';
import ClustersTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/VerrazzanoWebLogic8Workload/ClustersTab';
import ConfigurationDataTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/VerrazzanoWebLogic8Workload/ConfigurationDataTab';
import FluentdSpecificationTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/FluentdSpecificationTab';
import WebLogicGeneralDataTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/WebLogicGeneralDataTab';
import ManagedServersTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ManagedServersTab';
import MonitoringExporterTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/MonitoringExporterTab';
import ServerPodTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/VerrazzanoWebLogic8Workload/ServerPodTab';
import ServerServiceTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ServerServiceTab';
import TreeTabbed from '@pkg/components/TreeTabbed';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'VerrazzanoWebLogic8Workload',
  components: {
    AdminServerTab,
    AuxiliaryImageVolumesTab,
    ClustersTab,
    ConfigurationDataTab,
    FluentdSpecificationTab,
    ManagedServersTab,
    MonitoringExporterTab,
    ServerPodTab,
    ServerServiceTab,
    TreeTabbed,
    WebLogicGeneralDataTab,
  },
  mixins: [WebLogicWorkloadHelper],
  props:  {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
  data() {
    const domainHomeSourceType = this.getWorkloadSpecField('domainHomeSourceType');

    return {
      isModelInImage: domainHomeSourceType === 'FromModel',
      configRoot:     this.value,
      namespace:      '',
    };
  },
  watch: {
    'value.spec.workload.spec.template.domainHomeSourceType'(neu, old) {
      this.isModelInImage = neu === 'FromModel';
    },
  },
};
</script>

<template>
  <TreeTabbed>
    <template #nestedTabs>
      <WebLogicGeneralDataTab
        :value="workloadTemplate"
        :mode="mode"
        :namespaced-object="value"
        tab-name="general"
        @input="$emit('input', value)"
      />
      <!-------------------------------------------------------------------------------------------------------
       |                                  Auxiliary Image Volumes Tab                                         |
       -------------------------------------------------------------------------------------------------------->

      <AuxiliaryImageVolumesTab
        :value="getWorkloadSpecListField('auxiliaryImageVolumes')"
        :mode="mode"
        tab-name="auxiliaryImageVolumes"
        @input="setWorkloadSpecFieldIfNotEmpty('auxiliaryImageVolumes', $event)"
      />

      <!-------------------------------------------------------------------------------------------------------
       |                                       Configuration Tab                                              |
       -------------------------------------------------------------------------------------------------------->

      <ConfigurationDataTab
        :value="getWorkloadSpecField('configuration')"
        :mode="mode"
        :namespaced-object="value"
        :template-object="workloadTemplate"
        tab-name="configuration"
        @input="setWorkloadSpecFieldIfNotEmpty('configuration', $event)"
        @delete="setWorkloadSpecField('configuration', undefined)"
      />

      <!-------------------------------------------------------------------------------------------------------
       |                                         Server Pod Tabs                                              |
       -------------------------------------------------------------------------------------------------------->

      <ServerPodTab
        :value="getWorkloadSpecField('serverPod')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="serverPod"
        @input="setWorkloadSpecFieldIfNotEmpty('serverPod', $event)"
        @delete="setWorkloadSpecField('serverPod', undefined)"
      />

      <!-------------------------------------------------------------------------------------------------------
       |                                       Server Service Tab                                             |
       -------------------------------------------------------------------------------------------------------->

      <ServerServiceTab
        :value="getWorkloadSpecField('serverService')"
        :mode="mode"
        tab-name="serverService"
        @input="setWorkloadSpecFieldIfNotEmpty('serverService', $event)"
        @delete="setWorkloadSpecField('serverService', undefined)"
      />

      <!-------------------------------------------------------------------------------------------------------
       |                                          Clusters Tab                                                |
       -------------------------------------------------------------------------------------------------------->

      <ClustersTab
        :value="getWorkloadSpecListField('clusters')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="clusters"
        @input="setWorkloadSpecFieldIfNotEmpty('clusters', $event)"
      />

      <!-------------------------------------------------------------------------------------------------------
       |                                        Admin Server Tab                                              |
       -------------------------------------------------------------------------------------------------------->

      <AdminServerTab
        :value="getWorkloadSpecField('adminServer')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="adminServer"
        @input="setWorkloadSpecFieldIfNotEmpty('adminServer', $event)"
        @delete="setWorkloadSpecField('adminServer', undefined)"
      />

      <!-------------------------------------------------------------------------------------------------------
       |                                      Managed Servers Tab                                             |
       -------------------------------------------------------------------------------------------------------->

      <ManagedServersTab
        :value="getWorkloadSpecListField('managedServers')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="managedServers"
        @input="setWorkloadSpecFieldIfNotEmpty('managedServers', $event)"
      />

      <!-------------------------------------------------------------------------------------------------------
       |                                          Fluentd Tab                                                 |
       -------------------------------------------------------------------------------------------------------->

      <FluentdSpecificationTab
        :value="getWorkloadSpecField('fluentdSpecification')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="fluentd"
        @input="setWorkloadSpecFieldIfNotEmpty('fluentdSpecification', $event)"
        @delete="setWorkloadSpecField('fluentdSpecification', undefined)"
      />

      <!-------------------------------------------------------------------------------------------------------
       |                                    Monitoring Exporter Tab                                           |
       -------------------------------------------------------------------------------------------------------->

      <MonitoringExporterTab
        :value="getWorkloadSpecField('monitoringExporter')"
        :mode="mode"
        tab-name="monitoringExporter"
        @input="setWorkloadSpecFieldIfNotEmpty('monitoringExporter', $event)"
        @delete="setWorkloadSpecField('monitoringExporter', undefined)"
      />
    </template>
  </TreeTabbed>
</template>

<style scoped>
</style>
