<script>
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
export default {
  components: { LabeledInput, Checkbox },
  props:      {
    spec: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    const {
      host = '', path = '', prefix = '', toHTTPS = false
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
  <div id="redirect" class="row inputs" @input="change">
    <LabeledInput v-model="host" label="host" />
    <LabeledInput v-model="path" label="path" />
    <LabeledInput v-model="prefix" label="prefix" />
    <Checkbox v-model="toHTTPS" label="Change protocol to HTTPS" />
  </div>
</template>
