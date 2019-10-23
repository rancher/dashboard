<script>
import LabeledInput from '@/components/form/LabeledInput';
export default {
  components: { LabeledInput },
  props:      {
    spec: {
      type:    Object,
      default: () => {}
    }
  },
  data() {
    const { host, path } = this.spec;

    return { host, path };
  },
  methods: {
    change() {
      const { host, path } = this;

      this.$emit('input', { host, path });
    }
  }
};
</script>

<template>
  <div @input="change">
    <LabeledInput v-model="host" label="host" />
    <LabeledInput v-model="path" label="path" />
  </div>
</template>
