<script>
// Added by Verrazzano
import AffinityTab from '@pkg/components/AffinityTab';
import ApplicationSpecTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/ApplicationSpecTab';
import CoherenceActionsTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/CoherenceActionsTab';
import CoherenceGeneralTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/CoherenceGeneralTab';
import CoherenceSpecTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/CoherenceSpecTab';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import ConfigMapVolumesTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/ConfigMapVolumesTab';
import ContainerResourcesTab from '@pkg/components/ContainerResourcesTab';
import ContainerSecurityContextTab from '@pkg/components/ContainerSecurityContextTab';
import ContainersTab from '@pkg/components/ContainersTab';
import EnvironmentVariables from '@pkg/components/EnvironmentVariables';
import JVMSpecTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/JVMSpecTab';
import LabelsTab from '@pkg/components/LabelsTab';
import NamedPortsSpecTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/NamedPortsSpecTab';
import NetworkSpecTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/NetworkSpecTab';
import NodeSelector from '@pkg/components/NodeSelector';
import PodSecurityContextTab from '@pkg/components/PodSecurityContextTab';
import ProbeTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/ProbeTab';
import ReadinessGatesTab from '@pkg/components/ReadinessGatesTab';
import ReadinessProbeSpecTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/ReadinessProbeSpecTab';
import ScalingSpecTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/ScalingSpecTab';
import SecretVolumesTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/SecretVolumesTab';
import StartQuorumsTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/StartQuorumsTab';
import TolerationsTab from '@pkg/components/TolerationsTab';
import TopologySpreadConstraintsTab from '@pkg/components/TopologySpreadConstraintsTab';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import TreeTabbed from '@pkg/components/TreeTabbed';
import VolumeClaimTemplatesTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/VolumeClaimTemplatesTab';
import VolumeMountsTab from '@pkg/components/VolumeMountsTab';
import VolumesTab from '@pkg/components/VolumesTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';

export default {
  name:       'VerrazzanoCoherenceWorkload',
  components: {
    TabDeleteButton,
    AffinityTab,
    ApplicationSpecTab,
    CoherenceActionsTab,
    CoherenceGeneralTab,
    CoherenceSpecTab,
    ConfigMapVolumesTab,
    ContainerResourcesTab,
    ContainerSecurityContextTab,
    ContainersTab,
    EnvironmentVariables,
    JVMSpecTab,
    LabelsTab,
    NamedPortsSpecTab,
    NetworkSpecTab,
    NodeSelector,
    PodSecurityContextTab,
    ProbeTab,
    ReadinessGatesTab,
    ReadinessProbeSpecTab,
    ScalingSpecTab,
    SecretVolumesTab,
    StartQuorumsTab,
    TolerationsTab,
    TopologySpreadConstraintsTab,
    TreeTab,
    TreeTabbed,
    VolumeClaimTemplatesTab,
    VolumeMountsTab,
    VolumesTab,
  },
  mixins: [CoherenceWorkloadHelper],
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
  methods:  {
    initSpec() {
      this.$set(this.value, 'spec', {
        workload: {
          apiVersion: this.verrazzanoComponentApiVersion,
          kind:       'VerrazzanoCoherenceWorkload',
          spec:       {
            template: {
              metadata: { },
              spec:     { }
            }
          }
        }
      });
    },
    deleteLabelsAndAnnotations() {
      this.setWorkloadMetadataField('annotations', undefined);
      this.setWorkloadMetadataField('labels', undefined);
    },
  },
  created() {
    if (!this.value.spec?.workload?.spec?.template) {
      this.initSpec();
    }
  },
};
</script>

<template>
  <TreeTabbed>
    <template #nestedTabs>
      <CoherenceGeneralTab
        :value="workloadTemplateSpec"
        :mode="mode"
        :namespaced-object="value"
        tab-name="general"
        @input="$emit('input', value)"
      />
      <CoherenceSpecTab
        :value="getWorkloadSpecField('coherence')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="coherence"
        @input="setWorkloadSpecFieldIfNotEmpty('coherence', $event)"
        @delete="setWorkloadSpecField('coherence', undefined)"
      />
      <ApplicationSpecTab
        :value="getWorkloadSpecField('application')"
        :mode="mode"
        tab-name="application"
        @input="setWorkloadSpecFieldIfNotEmpty('application', $event)"
        @delete="setWorkloadSpecField('application', undefined)"
      />
      <JVMSpecTab
        :value="getWorkloadSpecField('jvm')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="jvm"
        @input="setWorkloadSpecFieldIfNotEmpty('jvm', $event)"
        @delete="setWorkloadSpecField('jvm', undefined)"
      />
      <NamedPortsSpecTab
        :value="getWorkloadSpecListField('ports')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="ports"
        @input="setWorkloadSpecFieldIfNotEmpty('ports', $event)"
      />
      <ScalingSpecTab
        :value="getWorkloadSpecField('scaling')"
        :mode="mode"
        tab-name="scaling"
        @input="setWorkloadSpecFieldIfNotEmpty('scaling', $event)"
        @delete="setWorkloadSpecField('scaling', undefined)"
      />
      <ProbeTab
        :value="getWorkloadSpecField('suspendProbe')"
        :mode="mode"
        tab-name="suspendProbe"
        :tab-label="t('verrazzano.coherence.tabs.suspendProbe')"
        @input="setWorkloadSpecFieldIfNotEmpty('suspendProbe', $event)"
        @delete="setWorkloadSpecField('suspendProbe', undefined)"
      />
      <StartQuorumsTab
        :value="getWorkloadSpecListField('startQuorum')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="startQuorum"
        @input="setWorkloadSpecFieldIfNotEmpty('startQuorum', $event)"
      />
      <TreeTab name="envVars" :label="t('verrazzano.common.tabs.environmentVariables')">
        <template #default>
          <EnvironmentVariables
            :value="workloadTemplateSpec"
            :mode="mode"
            :namespaced-object="value"
            :enable-env-from-options="false"
            @input="$emit('input', value)"
          />
        </template>
      </TreeTab>
      <LabelsTab
        :value="workloadTemplateSpec"
        :mode="mode"
        tab-name="labels"
        @input="$emit('input', value)"
      />
      <ContainersTab
        :value="getWorkloadSpecListField('initContainers')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="initContainers"
        :tab-label="t('verrazzano.common.tabs.initContainers')"
        @input="setWorkloadSpecFieldIfNotEmpty('initContainers', $event)"
      />
      <ContainersTab
        :value="getWorkloadSpecListField('sideCars')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="sideCars"
        :tab-label="t('verrazzano.coherence.tabs.sideCars')"
        @input="setWorkloadSpecFieldIfNotEmpty('sideCars', $event)"
      />
      <ConfigMapVolumesTab
        :value="getWorkloadSpecListField('configMapVolumes')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="configMapVolumes"
        @input="setWorkloadSpecFieldIfNotEmpty('configMapVolumes', $event)"
      />
      <SecretVolumesTab
        :value="getWorkloadSpecListField('secretVolumes')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="secretVolumes"
        @input="setWorkloadSpecFieldIfNotEmpty('secretVolumes', $event)"
      />
      <VolumesTab
        :value="getWorkloadSpecListField('volumes')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="volumes"
        @input="setWorkloadSpecFieldIfNotEmpty('volumes', $event)"
      />
      <VolumeClaimTemplatesTab
        :value="getWorkloadSpecListField('volumeClaimTemplates')"
        :mode="mode"
        tab-name="volumeClaimsTemplates"
        @input="setWorkloadSpecFieldIfNotEmpty('volumeClaimTemplates', $event)"
      />
      <VolumeMountsTab
        :value="getWorkloadSpecListField('volumeMounts')"
        :mode="mode"
        tab-name="volumeMounts"
        @input="setWorkloadSpecFieldIfNotEmpty('volumeMounts', $event)"
      />
      <ReadinessProbeSpecTab
        :value="getWorkloadSpecField('readinessProbe')"
        :mode="mode"
        is-readiness-probe
        tab-name="readinessProbe"
        :tab-label="t('verrazzano.common.tabs.readinessProbe')"
        @input="setWorkloadSpecFieldIfNotEmpty('readinessProbe', $event)"
        @delete="setWorkloadSpecField('readinessProbe', undefined)"
      />
      <ReadinessProbeSpecTab
        :value="getWorkloadSpecField('livenessProbe')"
        :mode="mode"
        tab-name="livenessProbe"
        :tab-label="t('verrazzano.common.tabs.livenessProbe')"
        @input="setWorkloadSpecFieldIfNotEmpty('livenessProbe', $event)"
        @delete="setWorkloadSpecField('livenessProbe', undefined)"
      />
      <ReadinessProbeSpecTab
        :value="getWorkloadSpecField('startupProbe')"
        :mode="mode"
        tab-name="startupProbe"
        :tab-label="t('verrazzano.common.tabs.startupProbe')"
        @input="setWorkloadSpecFieldIfNotEmpty('startupProbe', $event)"
        @delete="setWorkloadSpecField('startupProbe', undefined)"
      />
      <ReadinessGatesTab
        :value="getWorkloadSpecListField('readinessGates')"
        :mode="mode"
        tab-name="readinessGates"
        @input="setWorkloadSpecFieldIfNotEmpty('readinessGates', $event)"
      />
      <ContainerResourcesTab
        :value="getWorkloadSpecField('resources')"
        :mode="mode"
        tab-name="resources"
        @input="setWorkloadSpecFieldIfNotEmpty('resources', $event)"
        @delete="setWorkloadSpecField('resources', undefined)"
      />
      <AffinityTab
        :value="getWorkloadSpecField('affinity')"
        :mode="mode"
        tab-name="affinity"
        @input="setWorkloadSpecFieldIfNotEmpty('affinity', $event)"
        @delete="setWorkloadSpecField('affinity', undefined)"
      />
      <TreeTab name="nodeSelector" :label="t('verrazzano.coherence.tabs.nodeSelector')">
        <template #beside-header>
          <TabDeleteButton
            :element-name="t('verrazzano.coherence.tabs.nodeSelector')"
            :mode="mode"
            @click="setWorkloadSpecField('nodeSelector', undefined)"
          />
        </template>
        <template #default>
          <NodeSelector
            :value="getWorkloadSpecField('nodeSelector')"
            :mode="mode"
            @input="setWorkloadSpecFieldIfNotEmpty('nodeSelector', $event)"
          />
        </template>
      </TreeTab>
      <TolerationsTab
        :value="getWorkloadSpecListField('tolerations')"
        :mode="mode"
        tab-name="tolerations"
        @input="setWorkloadSpecFieldIfNotEmpty('tolerations', $event)"
      />
      <PodSecurityContextTab
        :value="getWorkloadSpecField('securityContext')"
        :mode="mode"
        tab-name="securityContext"
        @input="setWorkloadSpecFieldIfNotEmpty('securityContext', $event)"
        @delete="setWorkloadSpecField('securityContext', undefined)"
      />
      <ContainerSecurityContextTab
        :value="getWorkloadSpecField('containerSecurityContext')"
        :mode="mode"
        tab-name="containerSecurityContext"
        @input="setWorkloadSpecFieldIfNotEmpty('containerSecurityContext', $event)"
        @delete="setWorkloadSpecField('containerSecurityContext', undefined)"
      />
      <NetworkSpecTab
        :value="getWorkloadSpecField('network')"
        :mode="mode"
        tab-name="network"
        @input="setWorkloadSpecFieldIfNotEmpty('network', $event)"
        @delete="setWorkloadSpecField('network', undefined)"
      />
      <CoherenceActionsTab
        :value="getWorkloadSpecListField('actions')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="actions"
        @input="setWorkloadSpecFieldIfNotEmpty('actions', $event)"
      />
      <TopologySpreadConstraintsTab
        :value="getWorkloadSpecListField('topologySpreadConstraints')"
        :mode="mode"
        tab-name="topologySpreadConstraints"
        @input="setWorkloadSpecFieldIfNotEmpty('topologySpreadConstraints', $event)"
      />
    </template>
  </TreeTabbed>
</template>

<style scoped>

</style>
