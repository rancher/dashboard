<script>
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import ResourceYaml from '@shell/components/ResourceYaml';
import Labels from '@shell/components/form/Labels';
import jsyaml from 'js-yaml';
import { saferDump } from '@shell/utils/create-yaml';

export default {
  name:       'MachineRegistrationEdit',
  components: {
    Loading, LabeledInput, CruResource, ResourceYaml, Labels
  },
  mixins:     [CreateEditView],
  props:      {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },
  data() {
    return { cloudConfig: typeof this.value.spec.cloudConfig === 'string' ? this.value.spec.cloudConfig : saferDump(this.value.spec.cloudConfig) };
  },
  methods: {
    updateCloudConfig(val) {
      this.value.spec.cloudConfig = jsyaml.load(val);
    }
  },
};
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :can-yaml="false"
    :mode="mode"
    :resource="value"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
  >
    <div class="row mt-40 mb-10">
      <div class="col span-6 mb-20">
        <h3>{{ t('elemental.machineRegistration.create.configuration') }}</h3>
        <LabeledInput
          v-model.trim="value.metadata.name"
          :required="true"
          :label="t('elemental.machineRegistration.create.name.label')"
          :placeholder="t('elemental.machineRegistration.create.name.placeholder', null, true)"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6 mb-20">
        <h3>{{ t('elemental.machineRegistration.create.cloudConfiguration') }}</h3>
        <ResourceYaml
          ref="resourceyaml"
          :value="value"
          :mode="mode"
          :yaml="cloudConfig"
          :offer-preview="false"
          :hide-cancel-and-save="true"
          @change="updateCloudConfig"
        >
        </resourceyaml>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6 mb-20">
        <Labels
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </div>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>

</style>
