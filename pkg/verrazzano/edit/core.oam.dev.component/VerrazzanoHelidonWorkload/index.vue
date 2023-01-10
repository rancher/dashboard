<script>
// Added by Verrazzano
import DeploymentStrategy from '@pkg/components/DeploymentStrategy';
import HelidonWorkloadHelper from '@pkg/mixins/helidon-workload-helper';
import Labels from '@pkg/components/LabelsTab/Labels';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import PodSpecTab from '@pkg/components/PodSpecTab';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import TreeTabbed from '@pkg/components/TreeTabbed';

export default {
  name:       'VerrazzanoHelidonWorkload',
  components: {
    DeploymentStrategy,
    LabeledInput,
    Labels,
    PodSpecTab,
    TreeTab,
    TreeTabbed,
  },
  mixins: [HelidonWorkloadHelper],
  props:  {
    mode: {
      type:    String,
      default: 'create'
    },
    value: {
      type:     Object,
      required: true
    },
  },

  methods: {
    initSpec() {
      this.$set(this.value, 'spec', {
        workload: {
          apiVersion: this.verrazzanoComponentApiVersion,
          kind:       'VerrazzanoHelidonWorkload',
          spec:       { deploymentTemplate: { podSpec: { } } }
        }
      });
    },
  },
  created() {
    if (!this.value.spec?.workload?.apiVersion) {
      this.initSpec();
    }
  },
};
</script>

<template>
  <TreeTabbed :side-tabs="false">
    <template #nestedTabs>
      <TreeTab :label="t('verrazzano.common.tabs.workload')" name="workload">
        <template #default>
          <div class="row">
            <div class="col span-4">
              <LabeledInput
                :value="getWorkloadMetadataField('name')"
                :mode="mode"
                :placeholder="getWorkloadMetadataNotSetPlaceholder('name')"
                :label="t('verrazzano.helidon.fields.workloadName')"
                @input="setWorkloadMetadataFieldIfNotEmpty('name', $event)"
              />
            </div>
          </div>
          <div class="spacer" />
          <div>
            <Labels v-model="workloadMetadata" :mode="mode" />
          </div>
        </template>
      </TreeTab>

      <TreeTab :label="t('verrazzano.helidon.tabs.deployment')" name="deployment">
        <template #default>
          <div class="row">
            <div class="col span-4">
              <LabeledInput
                :value="getWorkloadDeploymentTemplateMetadataField('name')"
                :mode="mode"
                :placeholder="getWorkloadDeploymentTemplateMetadataNotSetPlaceholder('name')"
                :label="t('verrazzano.helidon.fields.deploymentTemplateName')"
                @input="setWorkloadDeploymentTemplateMetadataField('name', $event)"
              />
            </div>
          </div>
          <div class="spacer" />
          <div>
            <Labels v-model="workloadDeploymentTemplateMetadata" :mode="mode" />
          </div>
        </template>
        <template #nestedTabs>
          <TreeTab :label="t('verrazzano.helidon.tabs.strategy')" name="strategy">
            <DeploymentStrategy
              :value="getWorkloadDeploymentTemplateField('strategy')"
              :mode="mode"
              @input="setFieldIfNotEmpty('strategy', $event)"
            />
          </TreeTab>
          <PodSpecTab
            :value="getWorkloadDeploymentTemplateField('podSpec')"
            :mode="mode"
            :namespaced-object="value"
            tab-name="podSpec"
            @input="setWorkloadDeploymentTemplateField('podSpec', $event)"
          />
        </template>
      </TreeTab>
    </template>
  </TreeTabbed>
</template>
