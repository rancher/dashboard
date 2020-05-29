<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
export default {
  components: { LabeledInput, LabeledSelect },

  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    targets:  {
      type:    Array,
      default: () => []
    }
  },

  data() {
    const { backend = {}, path = '' } = this.value;
    const { serviceName = '', servicePort = '' } = backend;

    return {
      serviceName, servicePort, path
    };
  },

  methods: {
    update() {
      const out = { backend: { serviceName: this.serviceName, servicePort: this.servicePort }, path: this.path };

      this.$emit('input', out);
    }
  }
};
</script>

<template>
  <div class="rule-path row mb-0" @input="update">
    <div class="col span-4">
      <LabeledInput v-model="path" label="Path" placeholder="e.g. /foo" />
    </div>
    <div class="col span-4">
      <LabeledSelect v-model="serviceName" label="Target" option-label="Target" :options="targets" @input="update" />
    </div>
    <div class="col span-3" :style="{'margin-right': '0px'}">
      <LabeledInput v-model.number="servicePort" label="Port" placeholder="e.g. 80" />
    </div>
    <button class="btn role-link col" @click="$emit('remove')">
      remove
    </button>
  </div>
</template>

<style lang="scss" scoped>
.rule-path {
  button {
    line-height: 40px;
  }
}
</style>
