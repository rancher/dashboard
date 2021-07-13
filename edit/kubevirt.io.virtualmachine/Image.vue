<script>
import LabeledSelect from '@/components/form/LabeledSelect';
import InputOrDisplay from '@/components/InputOrDisplay';
import { HCI } from '@/config/types';

export default {
  components: { LabeledSelect, InputOrDisplay },

  props: {
    value: {
      type:    String,
      default: ''
    },
    disabled: {
      type:    Boolean,
      default: false
    },
    required: {
      type:    Boolean,
      default: true
    },
    mode: {
      type:     String,
      default: 'edit',
    },
  },

  data() {
    const tip = this.t('harvester.vmPage.imageTip');

    return {
      tip:        this.disabled ? '' : tip,
      image:      this.value,
    };
  },

  computed: {
    ImageOption() {
      const choise = this.$store.getters['cluster/all'](HCI.IMAGE);

      return choise
        .filter( I => I.isReady)
        .map((I) => {
          return {
            label: I.spec.displayName,
            value: I.spec.displayName
          };
        });
    }
  },

  watch: {
    value(neu) {
      this.image = neu;
    }
  },

  methods: {
    update() {
      this.$emit('input', this.image);
    }
  }
};
</script>

<template>
  <InputOrDisplay :name="t('harvester.vmPage.input.image')" :value="image" :mode="mode" class="mb-20">
    <LabeledSelect
      v-model="image"
      :disabled="disabled"
      :mode="mode"
      :label="t('harvester.vmPage.input.image')"
      :required="required"
      :options="ImageOption"
      :tooltip="tip"
      :hover-tooltip="true"
      @input="update"
    />
  </InputOrDisplay>
</template>
