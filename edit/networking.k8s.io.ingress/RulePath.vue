<script>
import InputWithSelect from '@/components/form/InputWithSelect';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

export default {
  components: {
    InputWithSelect, LabeledInput, LabeledSelect
  },
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
    },
    showPathType: {
      type:    Boolean,
      default: false
    }
  },
  data() {
    const pathTypes = [
      'Prefix',
      'Exact',
      'ImplementationSpecific'
    ];
    const { backend = {}, path = '', pathType = pathTypes[0] } = this.value;
    const { serviceName = '', servicePort = '' } = backend;

    return {
      serviceName, servicePort, path, pathType, pathTypes
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
    },
  },
  methods: {
    update() {
      const servicePort = Number.parseInt(this.servicePort) || this.servicePort;
      const serviceName = this.serviceName.label || this.serviceName;
      const out = {
        backend: { serviceName, servicePort }, path: this.path, pathType: this.pathType
      };

      this.$emit('input', out);
    },
    updatePathTypeAndPath(values) {
      this.path = values.text;
      this.pathType = values.selected;
      this.update();
    }
  }
};
</script>
<template>
  <div class="rule-path row">
    <div v-if="showPathType" class="col span-6">
      <InputWithSelect
        :options="pathTypes"
        :placeholder="t('ingress.rules.path.placeholder', undefined, true)"
        :select-value="pathType"
        :text-value="path"
        @input="updatePathTypeAndPath"
      />
    </div>
    <div v-else class="col span-4">
      <input v-model="path" :placeholder="t('ingress.rules.path.placeholder', undefined, true)" @input="update" />
    </div>
    <div class="col" :class="{'span-3': showPathType, 'span-4': !showPathType}">
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
    <div class="col" :class="{'span-2': showPathType, 'span-3': !showPathType}" :style="{'margin-right': '0px'}">
      <LabeledInput
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
