<script>
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  name:       'OsImages',
  components: {
    Loading, LabeledInput, CruResource
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
    return {
      modelData: {
        name:   '',
        device: ''
      }
    };
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
    <h1>OsImages</h1>
    <div class="row mt-40 mb-10">
      <div class="col span-6 mb-20">
        <h3>{{ t('elemental.osimage.create.configuration') }}</h3>
        <LabeledInput
          v-model.trim="modelData.name"
          :required="true"
          :label="t('elemental.osimage.create.name.label')"
          :placeholder="t('elemental.osimage.create.name.placeholder', null, true)"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6 mb-20">
        <h3>{{ t('elemental.osimage.create.cloudConfiguration') }}</h3>
        <LabeledInput
          v-model.trim="modelData.device"
          :required="true"
          :label="t('elemental.osimage.create.device.label')"
          :placeholder="t('elemental.osimage.create.device.placeholder', null, true)"
          :mode="mode"
        />
      </div>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>

</style>
