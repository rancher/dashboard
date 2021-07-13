<script>
import Vue from 'vue';
import LabeledInput from '@/components/form/LabeledInput';
import RadioGroup from '@/components/form/RadioGroup';
import Tip from '@/components/Tip';
import CreateEditView from '@/mixins/create-edit-view';

export default {
  name:       'EditVlan',
  components: {
    LabeledInput,
    RadioGroup,
    Tip
  },

  mixins: [CreateEditView],

  props:  {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    if (!this.value.config) {
      Vue.set(this.value, 'config', { defaultPhysicalNIC: '' });
    }

    return {};
  },

  computed: {
    doneLocationOverride() {
      return this.value.listLocation;
    }
  },
};
</script>

<template>
  <div>
    <RadioGroup
      v-model="value.enable"
      class="mb-20"
      name="model"
      :options="[true,false]"
      :labels="[t('generic.enabled'), t('generic.disabled')]"
    />

    <LabeledInput
      v-if="value.enable"
      v-model="value.config.defaultPhysicalNIC"
      :label="t('harvester.setting.defaultPhysicalNIC')"
      class="mb-5"
    />

    <Tip v-if="value.enable" icon="icons icon-h-question" :text="t('harvester.setting.vlanChangeTip')" />
  </div>
</template>

<style lang="scss" scoped>
  ::v-deep .radio-group {
    display: flex;
    .radio-container {
      margin-right: 30px;
    }
  }
</style>
