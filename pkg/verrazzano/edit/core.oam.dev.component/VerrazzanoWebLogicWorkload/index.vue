<script>
// Added by Verrazzano
import AdminServerTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/AdminServerTab';
import AuxiliaryImageVolumesTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/AuxiliaryImageVolumesTab';
import ClustersTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ClustersTab';
import ConfigurationDataTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ConfigurationDataTab';
import FluentdSpecificationTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/FluentdSpecificationTab';
import WebLogicGeneralDataTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/WebLogicGeneralDataTab';
import ManagedServersTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ManagedServersTab';
import MonitoringExporterTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/MonitoringExporterTab';
import ServerPodTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ServerPodTab';
import ServerServiceTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ServerServiceTab';
import TreeTabbed from '@pkg/components/TreeTabbed';
import WeblogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

const WKO_DOMAIN_VERSION = 'domain-v8';

export default {
  name:       'VerrazzanoWebLogicWorkload',
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
  mixins: [WeblogicWorkloadHelper],
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
    return {
      configRoot: this.value,
      namespace:  '',
    };
  },
  computed: {
    isModelInImage() {
      return this.getWorkloadSpecField('domainHomeSourceType') === 'FromModel';
    },
  },
  methods:  {
    initSpec() {
      this.$set(this.configRoot, 'spec', {
        workload: {
          apiVersion: this.verrazzanoComponentApiVersion,
          kind:       'VerrazzanoWebLogicWorkload',
          spec:       {
            template: {
              metadata: { labels: { 'weblogic.resourceVersion': WKO_DOMAIN_VERSION } },
              spec:     { }
            }
          }
        }
      });
    },
  },
  created() {
    if (!this.configRoot.spec?.workload?.spec?.template) {
      this.initSpec();
    }
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
        :is-model-in-image="isModelInImage"
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
        @input="setWorkloadSpecFieldIfNotEmpty('serverService', $event)"
        @delete="setWorkloadSpecField('serverService', undefined)"
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
