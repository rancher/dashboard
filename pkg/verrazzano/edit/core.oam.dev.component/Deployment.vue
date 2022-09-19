<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import DeploymentStrategy from '@pkg/components/DeploymentStrategy';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabelSelectorTab from '@pkg/components/LabelSelectorTab';
import OamComponentHelper from '@pkg/mixins/oam-component-helper';
import PodTemplateTab from '@pkg/components/PodTemplateTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import TreeTabbed from '@pkg/components/TreeTabbed';

export default {
  name:       'Deployment',
  components: {
    Checkbox,
    DeploymentStrategy,
    LabeledInput,
    LabelSelectorTab,
    PodTemplateTab,
    TabDeleteButton,
    TreeTab,
    TreeTabbed,
  },
  mixins: [OamComponentHelper],
  props:  {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
  methods: {
    initSpec() {
      this.setField('spec', {
        workload: {
          apiVersion: this.deploymentApiVersion,
          kind:       'Deployment',
          metadata:   { namespace: this.value.metadata.namespace },
        }
      });
    }
  },
  created() {
    if (!this.value.spec?.workload) {
      this.initSpec();
    }
  },
  watch: {
    'metadata.namespace'(neu, old) {
      if (neu) {
        this.setWorkloadFieldIfNotEmpty('metadata.namespace', neu);
      }
    },
  },
};
</script>

<template>
  <TreeTabbed>
    <template #nestedTabs>
      <TreeTab name="general" :label="t('verrazzano.common.tabs.general')">
        <template #default>
          <div class="row">
            <div class="col span-4">
              <LabeledInput
                :value="getWorkloadField('metadata.name')"
                :mode="mode"
                required
                :placeholder="getWorkloadMetadataNotSetPlaceholder('name')"
                :label="t('verrazzano.common.fields.workloadDeploymentName')"
                @input="setWorkloadMetadataFieldIfNotEmpty('name', $event)"
              />
            </div>
            <div class="col span-4">
              <LabeledInput
                :value="getWorkloadSpecField('replicas')"
                :mode="mode"
                type="Number"
                min="0"
                :placeholder="getWorkloadSpecNotSetPlaceholder('replicas')"
                :label="t('verrazzano.common.fields.replicas')"
                @input="setWorkloadSpecNumberField('replicas', $event)"
              />
            </div>
            <div class="col span-4">
              <div class="spacer-small" />
              <Checkbox
                :value="getWorkloadSpecField('paused')"
                :mode="mode"
                :label="t('verrazzano.common.fields.paused')"
                @input="setWorkloadSpecNumberField('paused', $event)"
              />
            </div>
          </div>
          <div class="spacer-small" />
          <div class="row">
            <div class="col span-4">
              <LabeledInput
                :value="getWorkloadSpecField('minReadySeconds')"
                :mode="mode"
                type="Number"
                min="0"
                :placeholder="getWorkloadSpecNotSetPlaceholder('minReadySeconds')"
                :label="t('verrazzano.common.fields.minReadySeconds')"
                @input="setWorkloadSpecNumberField('minReadySeconds', $event)"
              />
            </div>
            <div class="col span-4">
              <LabeledInput
                :value="getWorkloadSpecField('progressDeadlineSeconds')"
                :mode="mode"
                type="Number"
                min="0"
                :placeholder="getWorkloadSpecNotSetPlaceholder('progressDeadlineSeconds')"
                :label="t('verrazzano.common.fields.progressDeadlineSeconds')"
                @input="setWorkloadSpecNumberField('progressDeadlineSeconds', $event)"
              />
            </div>
            <div class="col span-4">
              <LabeledInput
                :value="getWorkloadSpecField('revisionHistoryLimit')"
                :mode="mode"
                type="Number"
                min="0"
                :placeholder="getWorkloadSpecNotSetPlaceholder('revisionHistoryLimit')"
                :label="t('verrazzano.common.fields.revisionHistoryLimit')"
                @input="setWorkloadSpecNumberField('revisionHistoryLimit', $event)"
              />
            </div>
          </div>
        </template>
        <template #nestedTabs>
          <TreeTab name="deploymentStrategy" :label="t('verrazzano.common.tabs.deploymentStrategy')">
            <template #beside-header>
              <TabDeleteButton
                :element-name="t('verrazzano.common.tabs.deploymentStrategy')"
                :mode="mode"
                @click="setWorkloadSpecField('strategy', undefined)"
              />
            </template>
            <template #default>
              <DeploymentStrategy
                :value="getWorkloadSpecField('strategy')"
                :mode="mode"
                @input="setWorkloadSpecFieldIfNotEmpty('strategy', $event)"
              />
            </template>
          </TreeTab>
          <LabelSelectorTab
            :value="getWorkloadSpecField('selector')"
            :mode="mode"
            tab-name="labelSelector"
            @input="setWorkloadSpecFieldIfNotEmpty('selector', $event)"
          />
          <PodTemplateTab
            :value="getWorkloadSpecField('template')"
            :mode="mode"
            :namespaced-object="value"
            tab-name="podTemplate"
            @input="setWorkloadSpecFieldIfNotEmpty('template', $event)"
          />
        </template>
      </TreeTab>
    </template>
  </TreeTabbed>
</template>

<style scoped>

</style>
