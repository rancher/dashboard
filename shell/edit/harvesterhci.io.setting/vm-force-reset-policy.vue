<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledInput from '@shell/components/form/LabeledInput';
import RadioGroup from '@shell/components/form/RadioGroup';

export default {
  name: 'HarvesterVMForceDeletePolicy',

  components: { LabeledInput, RadioGroup },

  mixins: [CreateEditView],

  data() {
    let parseDefaultValue = {};

    try {
      parseDefaultValue = JSON.parse(this.value.value);
    } catch (error) {
      parseDefaultValue = JSON.parse(this.value.default);
    }

    return { parseDefaultValue };
  },

  created() {
    this.update();
  },

  methods: {
    update() {
      const value = JSON.stringify(this.parseDefaultValue);

      this.$set(this.value, 'value', value);
    }
  },

  watch: {
    value: {
      handler(neu) {
        const parseDefaultValue = JSON.parse(neu.value);

        this.$set(this, 'parseDefaultValue', parseDefaultValue);
      },
      deep: true
    }
  }
};
</script>

<template>
  <div class="row" @input="update">
    <div class="col span-12">
      <RadioGroup
        v-model="parseDefaultValue.enable"
        class="mb-20"
        name="model"
        :options="[true,false]"
        :labels="[t('generic.enabled'), t('generic.disabled')]"
        @input="update"
      />

      <LabeledInput
        v-if="parseDefaultValue.enable"
        v-model.number="parseDefaultValue.period"
        v-int-number
        class="mb-20"
        :mode="mode"
        label-key="harvester.setting.vmForceDeletionPolicy.period"
      />
    </div>
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
