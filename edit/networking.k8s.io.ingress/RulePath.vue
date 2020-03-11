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

    ruleMode: {
      type:    String,
      default: 'edit'
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
      let out;

      // do not include path if rule is for default backend
      if (this.ruleMode === 'asDefault') {
        out = { backend: { serviceName: this.serviceName, servicePort: this.servicePort } };
      } else {
        out = { backend: { serviceName: this.serviceName, servicePort: this.servicePort }, path: this.path };
      }

      this.$emit('input', out);
    }
  }
};
</script>

<template>
  <div class="row mb-0" @input="update">
    <div v-if="ruleMode!=='asDefault'" class="col span-4">
      <LabeledInput v-model="path" label="Path" placeholder="e.g. /foo" />
    </div>
    <div class="col span-4">
      <LabeledSelect v-model="serviceName" label="Target" :options="targets" @input="update" />
    </div>
    <div class="col span-3" :style="{'margin-right': '0px'}">
      <LabeledInput v-model.number="servicePort" label="Port" placeholder="e.g. 80" />
    </div>
    <button class="btn btn-sm role-link col" @click="$emit('remove')">
      remove
    </button>
  </div>
</template>
