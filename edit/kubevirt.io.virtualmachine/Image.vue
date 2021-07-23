<script>
import LabeledSelect from '@/components/form/LabeledSelect';
import { HCI } from '@/config/types';

export default {
  components: { LabeledSelect },

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
    const tip = this.t('harvester.virtualMachine.imageTip');

    return {
      tip:        this.disabled ? '' : tip,
      image:      this.value,
    };
  },

  computed: {
    ImageOption() {
      const choise = this.$store.getters['virtual/all'](HCI.IMAGE);

      return choise
        .filter( I => I.isReady)
        .map((I) => {
          const value = I.id;
          const label = `${ I.metadata.namespace }/${ I.spec.displayName }`;

          return {
            label,
            value
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
  <LabeledSelect
    v-model="image"
    :disabled="disabled"
    :mode="mode"
    :label="t('harvester.virtualMachine.input.image')"
    :required="required"
    :options="ImageOption"
    :tooltip="tip"
    :hover-tooltip="true"
    @input="update"
  />
</template>
