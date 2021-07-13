<script>
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },
  props:      {
    row: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: false,
      default:  'edit'
    },
    disabled: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      pattern:  /^([1-9]|[1-5]?[0-9]{2,4}|6[1-4][0-9]{3}|65[1-4][0-9]{2}|655[1-2][0-9]|6553[1-5])$/,
      oldValue: this.row.port
    };
  },

  computed: {
    isView() {
      return this.mode === 'view';
    },
    isDisabled() {
      return this.isView || this.disabled;
    }
  },

  methods: {
    input(neu) {
      if (this.pattern.test(neu) || neu === '') {
        this.oldValue = neu;
      } else {
        this.row.port = this.oldValue;
      }
    }
  }
};
</script>

<template>
  <LabeledInput
    v-model="row.port"
    type="number"
    :mode="mode"
    :label="t('harvester.fields.port')"
    placeholder="e.g. 8080"
    :disabled="isDisabled"
  >
  </labeledinput>
</template>

<style lang="scss"></style>
