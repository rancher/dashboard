<script>
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
export default {
  components: { LabeledInput, Checkbox },
  props:      {
    spec: {
      type:    Object,
      default: () => {}
    }
  },
  data() {
    const {
      host, path, prefix, toHTTPS
    } = this.spec;

    return {
      host, path, prefix, toHTTPS
    };
  },
  methods: {
    change() {
      const {
        host, path, prefix, toHTTPS
      } = this;

      this.$emit('input', {
        host, path, prefix, toHTTPS
      });
    }
  }
};
</script>

<template>
  <div @input="change">
    <LabeledInput v-model="host" label="host" />
    <LabeledInput v-model="path" label="path" />
    <LabeledInput v-model="prefix" label="prefix" />
    <div class="check-container">
      <Checkbox v-model="toHTTPS" />
      <span>to HTTPS</span>
    </div>
  </div>
</template>
