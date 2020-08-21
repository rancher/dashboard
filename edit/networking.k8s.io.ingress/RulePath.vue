<script>
import LabeledSelect from '@/components/form/LabeledSelect';
export default {
  components: { LabeledSelect },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    serviceTargets:  {
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
  computed: {
    portOptions() {
      const service = this.serviceTargets.find(s => s.label === this.value);

      return service?.ports || [];
    },
    serviceTargetStatus() {
      const isValueAnOption = !this.serviceName || this.serviceTargets.find(target => this.serviceName === target.value);

      return isValueAnOption ? null : 'warning';
    },
    serviceTargetTooltip() {
      return this.serviceTargetStatus === 'warning' ? this.t('ingress.rules.target.doesntExist') : null;
    }
  },
  methods: {
    update() {
      const servicePort = Number.parseInt(this.servicePort) || this.servicePort;
      const serviceName = this.serviceName.label || this.serviceName;
      const out = { backend: { serviceName, servicePort }, path: this.path };

      this.$emit('input', out);
    }
  }
};
</script>
<template>
  <div class="rule-path row">
    <div class="col span-4">
      <input v-model="path" :placeholder="t('ingress.rules.path.placeholder', undefined, true)" @input="update" />
    </div>
    <div class="col span-4">
      <LabeledSelect
        v-model="serviceName"
        option-label="label"
        option-key="label"
        :options="serviceTargets"
        :status="serviceTargetStatus"
        :taggable="true"
        :tooltip="serviceTargetTooltip"
        @input="update(); servicePort = ''"
      />
    </div>
    <div class="col span-3" :style="{'margin-right': '0px'}">
      <input
        v-if="portOptions.length === 0"
        v-model="servicePort"
        :placeholder="t('ingress.rules.port.placeholder')"
        @input="update"
      />
      <LabeledSelect
        v-else
        v-model="servicePort"
        :options="portOptions"
        :placeholder="t('ingress.rules.port.placeholder')"
        @input="update"
      />
    </div>
    <button class="btn btn-sm role-link col" @click="$emit('remove')">
      {{ t('ingress.rules.removePath') }}
    </button>
  </div>
</template>
<style lang="scss" scoped>
.rule-path {
  button {
    line-height: 40px;
  }
  input {
    height: 55px;
  }
}
</style>
