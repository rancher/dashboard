<script>
// Added by Verrazzano
import ContainerizedWorkloadHelper from '@pkg/mixins/containerized-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Labels from '@pkg/components/LabelsTab/Labels';
import OAMContainersTab from '@pkg/edit/core.oam.dev.component/ContainerizedWorkload/OAMContainersTab';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import TreeTabbed from '@pkg/components/TreeTabbed';

export default {
  name:       'ContainerizedWorkload',
  components: {
    LabeledInput,
    LabeledSelect,
    Labels,
    OAMContainersTab,
    TreeTab,
    TreeTabbed,
  },
  mixins: [ContainerizedWorkloadHelper],
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
  computed: {
    archOptions() {
      return [
        { value: 'amd64', label: this.t('verrazzano.containerized.types.arch.amd64') },
        { value: 'arm64', label: this.t('verrazzano.containerized.types.arch.arm64') },
        { value: 'i386', label: this.t('verrazzano.containerized.types.arch.i386') },
        { value: 'arm', label: this.t('verrazzano.containerized.types.arch.arm') },
      ];
    },
    osTypeOptions() {
      return [
        { value: 'linux', label: this.t('verrazzano.containerized.types.osType.linux') },
        { value: 'windows', label: this.t('verrazzano.containerized.types.osType.windows') },
      ];
    }
  },
  methods:  {
    initSpec() {
      this.$set(this.value, 'spec', {
        workload: {
          apiVersion: this.oamContainerizedWorkloadApiVersion,
          kind:       'ContainerizedWorkload',
          metadata:   {},
          spec:       { containers: [] }
        }
      });
    },
  },
  created() {
    if (!this.workloadSpec) {
      this.initSpec();
    }
  },
};
</script>

<template>
  <TreeTabbed>
    <template #nestedTabs>
      <TreeTab name="workload" :label="t('verrazzano.common.tabs.workload')">
        <template #default>
          <div class="row">
            <div class="col span-4">
              <LabeledInput
                :value="getWorkloadMetadataField('name')"
                :mode="mode"
                :disabled="!isCreate"
                :placeholder="getWorkloadMetadataNotSetPlaceholder('name')"
                :label="t('verrazzano.containerized.fields.workloadName')"
                @input="setWorkloadMetadataField('name', $event)"
              />
            </div>
            <div class="col span-4">
              <LabeledSelect
                :value="getWorkloadSpecField('os')"
                :mode="mode"
                :options="osTypeOptions"
                option-key="value"
                option-label="label"
                :placeholder="getWorkloadSpecNotSetPlaceholder(value, 'os')"
                :label="t('verrazzano.containerized.fields.os')"
                @input="setWorkloadSpecFieldIfNotEmpty('os', $event)"
              />
            </div>
            <div class="col span-4">
              <LabeledSelect
                :value="getWorkloadSpecField('arch')"
                :mode="mode"
                :options="archOptions"
                option-key="value"
                option-label="label"
                :placeholder="getWorkloadSpecNotSetPlaceholder(value, 'arch')"
                :label="t('verrazzano.containerized.fields.arch')"
                @input="setWorkloadSpecFieldIfNotEmpty('arch', $event)"
              />
            </div>
          </div>
          <div class="spacer" />
          <Labels
            :value="getWorkloadMetadataField()"
            :mode="mode"
            @input="setWorkloadMetadataFieldIfNotEmpty('', $event)"
          />
        </template>
      </TreeTab>
      <OAMContainersTab
        :value="getWorkloadSpecField('containers')"
        :mode="mode"
        :namespaced-object="value"
        tab-name="containers"
        @input="setWorkloadSpecFieldIfNotEmpty('containers', $event)"
      />
    </template>
  </TreeTabbed>
</template>

<style scoped>

</style>
