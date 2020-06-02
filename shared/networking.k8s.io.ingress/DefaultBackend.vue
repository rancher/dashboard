<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { _VIEW } from '@/config/query-params';
import Banner from '@/components/Banner';

export default {
  components: {
    LabeledInput, LabeledSelect, Banner
  },

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
    },

    mode: {
      type:    String,
      default: 'edit'
    }
  },

  data() {
    const { serviceName = '', servicePort = '' } = this.value;

    return { serviceName, servicePort };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },
  },

  methods: {
    update() {
      const out = { serviceName: this.serviceName, servicePort: this.servicePort };

      this.$emit('input', out);
    }
  },
};
</script>

<template>
  <div>
    <Banner color="warning" label="Warning: Default backend is used globally for the entire cluster." />
    <div class="row">
      <div class="col span-4">
        <LabeledSelect v-model="serviceName" :mode="mode" label="Target Service" :options="targets" @input="update" />
      </div>
      <div class="col span-3" :style="{'margin-right': '0px'}">
        <LabeledInput v-model.number="servicePort" :mode="mode" label="Port" placeholder="e.g. 80" @input="update" />
      </div>
    </div>
  </div>
</template>
