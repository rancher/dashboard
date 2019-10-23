<script>
import LabeledInput from '@/components/form/LabeledInput';
export default {
  components: { LabeledInput },
  props:      {
    spec: {
      type:    Object,
      default: () => {
        return { name: '', value: '' };
      }
    }
  },
  data() {
    const { name, value } = this.spec;

    return { name, value };
  },
  methods: {
    change() {
      const { name, value } = this;

      this.$emit('input', { name, value });
    }
  }
};
</script>

<template>
  <div class="name-value" @input="change">
    <LabeledInput v-model="name" label="Name" />
    <LabeledInput v-model="value" label="Value" />
  </div>
</template>

<style lang='scss' scoped>
    .name-value {
        display: flex;
    }
</style>
